pragma solidity >=0.6.6;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./interfaces/IUniswapV2Pair.sol";
import "./interfaces/IDInterest.sol";
import "./interfaces/IReward.sol";

contract DaiLpPool is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    event onDeposit(address indexed user, uint256 amount, uint256 maturationTimestamp, uint256 depositId);
    event onWithdraw(address indexed user, uint256 amount, uint256 depositId);

    event LogSetDebaseRewardPercentage(uint256 debaseRewardPercentage_);
    event LogDebaseRewardIssued(uint256 rewardIssued, uint256 rewardsFinishBy);
    event LogSetBlockDuration(uint256 duration_);
    event LogSetPoolEnabled(bool poolEnabled_);

    struct DepositInfo {
        address owner;
        uint256 amount;
        uint256 daiAmount;
        uint256 debaseGonAmount;
        uint256 debaseReward;
        uint256 debaseRewardPerTokenPaid;
        uint256 daiDepositId;
        uint256 mphReward;
        uint256 maturationTimestamp;
        bool withdrawed;
    }

    uint256 private constant MAX_UINT256 = ~uint256(0);
    uint256 private constant INITIAL_FRAGMENTS_SUPPLY = 1000000 * 10**18;
    uint256 private constant TOTAL_GONS = MAX_UINT256 - (MAX_UINT256 % INITIAL_FRAGMENTS_SUPPLY);

    IUniswapV2Pair public debaseDaiPair;
    IDInterest public daiFixedPool;
    IReward public mphStakePool;
    IERC20 public dai;
    IERC20 public debase;
    IERC20 public mph;
    address public policy;

    uint256 public lpLimit;
    uint256 public maxDepositLimit;
    uint256 public totalLpLimit;
    uint256 public lockPeriod;
    bool public totalLpLimitEnabled;
    bool public maxDepositLimitEnabled;

    uint256 public totalLpLocked;

    mapping (uint256 => DepositInfo) public deposits;
    mapping (address => uint256) public lpDeposits;
    mapping (uint256 => uint256) oldAccDaiPerMphPerDeposit;
    uint256 depositLength;
    uint256 fee;
    address devAddr;

    // params for debase reward
    uint256 public blockDuration;
    bool public poolEnabled;

    uint256 public periodFinish;
    uint256 public debaseRewardRate;
    uint256 public lastUpdateBlock;
    uint256 public debaseRewardPerTokenStored;
    uint256 public debaseRewardPercentage;
    uint256 public debaseRewardDistributed;
    uint256 public accDaiPerMph;    // Accumulated DAI reward per staked mph, times 1e12. See below.

    modifier enabled() {
        require(poolEnabled, "Pool isn't enabled");
        _;
    }

    function _updateDebaseReward(uint256 depositId) internal {
        debaseRewardPerTokenStored = debaseRewardPerToken();
        lastUpdateBlock = lastBlockRewardApplicable();
        if (depositId < depositLength) {
            deposits[depositId].debaseReward = earned(depositId);
            deposits[depositId].debaseRewardPerTokenPaid = debaseRewardPerTokenStored;
        }
    }

    constructor(
        IUniswapV2Pair _debaseDaiPair,
        IERC20 _dai,
        IERC20 _debase,
        IERC20 _mph,
        address _policy,
        IDInterest _daiFixedPool,
        IReward _mphStakePool,
        uint256 _lpLimit,
        uint256 _totalLpLimit,
        uint256 _maxDepositLimit,
        bool _totalLpLimitEnabled,
        bool _maxDepositLimitEnabled,
        uint256 _lockPeriod,
        uint256 _fee,
        address _devAddr,
        uint256 _debaseRewardPercentage,
        uint256 _blockDuration
    ) public Ownable() {
        require (_devAddr != address(0), 'Invalid addr');
        debaseDaiPair = _debaseDaiPair;
        dai = _dai;
        debase = _debase;
        mph = _mph;
        policy = _policy;
        daiFixedPool = _daiFixedPool;
        mphStakePool = _mphStakePool;
        lpLimit= _lpLimit;
        totalLpLimit = _totalLpLimit;
        maxDepositLimit= _maxDepositLimit;
        totalLpLimitEnabled= _totalLpLimitEnabled;
        maxDepositLimitEnabled= _maxDepositLimitEnabled;
        lockPeriod= _lockPeriod;
        fee = _fee;
        devAddr = _devAddr;
        debaseRewardPercentage = _debaseRewardPercentage;
        blockDuration = _blockDuration;
    }

    function checkStabilizerAndGetReward(
        int256 supplyDelta_,
        int256 rebaseLag_,
        uint256 exchangeRate_,
        uint256 debasePolicyBalance
    ) external returns (uint256 rewardAmount_) {
        require(
            msg.sender == policy,
            "Only debase policy contract can call this"
        );

        if (block.number > periodFinish) {
            uint256 rewardToClaim =
                debasePolicyBalance.mul(debaseRewardPercentage).div(10**18);

            if (debasePolicyBalance >= rewardToClaim) {
                startNewDistribtionCycle();

                emit LogDebaseRewardIssued(rewardToClaim, periodFinish);
                return rewardToClaim;
            }
        }
        return 0;
    }

    function _depositLpToken(uint256 amount) internal returns (uint256 daiAmount, uint256 debaseAmount) {
        debaseDaiPair.transferFrom(msg.sender, address(this), amount);
        uint daiOldBalance = dai.balanceOf(address(this));
        uint debaseOldBalance = debase.balanceOf(address(this));
        debaseDaiPair.transfer(address(debaseDaiPair), amount);
        debaseDaiPair.burn(address(this));
        uint daiBalance = dai.balanceOf(address(this));
        uint debaseBalance = debase.balanceOf(address(this));

        daiAmount = daiBalance.sub(daiOldBalance);
        debaseAmount = debaseBalance.sub(debaseOldBalance);
    }

    function _depositDai(uint daiAmount) internal returns (uint256 mphReward, uint256 daiDepositId, uint256 maturationTimestamp) {
        uint mphOldBalance = mph.balanceOf(address(this));
        maturationTimestamp = block.timestamp.add(lockPeriod);
        daiFixedPool.deposit(daiAmount, maturationTimestamp);
        daiDepositId = daiFixedPool.depositsLength();
        uint mphBalance = mph.balanceOf(address(this));
        mphReward = mphBalance.sub(mphOldBalance);
    }

    function _updateMphReward() internal {
        uint daiOldBalance = dai.balanceOf(address(this));
        mphStakePool.getReward();
        uint daiBalance = dai.balanceOf(address(this));
        uint daiReward = daiBalance.sub(daiOldBalance);
        accDaiPerMph = accDaiPerMph
            .add(daiReward.mul(1e12)
            .div(mphStakePool.balanceOf(address(this))));
    }

    function _stakeMph(uint mphReward) internal returns (uint oldAccDaiPerMph) {
        oldAccDaiPerMph = accDaiPerMph;
        _updateMphReward();
        mphStakePool.stake(mphReward);
    }

    function _unstakeMph(uint depositId) internal returns (uint daiReward) {
        _updateMphReward();
        daiReward = accDaiPerMph
            .sub(oldAccDaiPerMphPerDeposit[depositId])
            .mul(deposits[depositId].mphReward)
            .div(1e12);
        mphStakePool.withdraw(deposits[depositId].mphReward);
    }

    function deposit(uint256 amount)
        external
        enabled
        returns (uint256)
    {
        require(totalLpLimitEnabled == false || totalLpLocked.add(amount) <= totalLpLimit, 'To much lp locked');
        require(maxDepositLimitEnabled == false || lpDeposits[msg.sender].add(amount) <= maxDepositLimit, 'to much deposit for this user');

        (uint daiAmount, uint debaseAmount) = _depositLpToken(amount);
        (uint mphReward, uint daiDepositId, uint maturationTimestamp) = _depositDai(daiAmount);

        lpDeposits[msg.sender] = lpDeposits[msg.sender].add(amount);
        totalLpLocked = totalLpLocked.add(amount);

        oldAccDaiPerMphPerDeposit[depositLength] = _stakeMph(mphReward);

        deposits[depositLength] = DepositInfo({
            owner: msg.sender,
            amount: amount,
            daiAmount: daiAmount,
            debaseGonAmount: debaseAmount.mul(_gonsPerFragment()),
            debaseReward: 0,
            debaseRewardPerTokenPaid: 0,
            daiDepositId: daiDepositId,
            maturationTimestamp: maturationTimestamp,
            mphReward: mphReward,
            withdrawed: false
        });
        depositLength = depositLength.add(1);

        _updateDebaseReward(daiDepositId);
        emit onDeposit(msg.sender, amount, maturationTimestamp, depositLength.sub(1));
        return depositLength.sub(1);
    }

    function _gonsPerFragment() internal view returns (uint256) {
        return TOTAL_GONS.div(debase.totalSupply());
    }

    function _withdrawDai(uint256 depositId, uint256 fundingId) internal {
        DepositInfo storage depositInfo = deposits[depositId];

        uint daiOldBalance = dai.balanceOf(address(this));
        uint mphStakingDaiReward = _unstakeMph(depositId);

        uint mphOldBalance = mph.balanceOf(address(this));
        daiFixedPool.withdraw(depositInfo.daiDepositId, fundingId);
        uint mphBalance = mph.balanceOf(address(this));

        uint daiBalance = dai.balanceOf(address(this));
        uint daiAmount = daiBalance.sub(daiOldBalance);
        uint totalDaiReward = daiAmount.add(mphStakingDaiReward).sub(depositInfo.daiAmount);

        uint mphReward = depositInfo.mphReward.add(mphBalance).sub(mphOldBalance);
        uint daiFee = totalDaiReward.mul(fee).div(1000);
        uint mphFee = mphReward.mul(fee).div(1000);

        dai.transfer(depositInfo.owner, depositInfo.daiAmount.add(totalDaiReward.sub(daiFee)));
        mph.transfer(depositInfo.owner, mphReward.sub(mphFee));

        dai.transfer(devAddr, daiFee);
        mph.transfer(devAddr, mphFee);
    }

    function withdraw(uint256 depositId, uint256 fundingId)
        public
        enabled
    {
        require (depositId < depositLength, 'no deposit');
        _updateDebaseReward(depositId);
        DepositInfo storage depositInfo = deposits[depositId];
        require (depositInfo.owner == msg.sender, 'not owner');
        require (depositInfo.withdrawed == false, 'withdrawed already');
        require (depositInfo.maturationTimestamp <= block.timestamp, 'still locked');

        _withdrawDai(depositId, fundingId);
        _payDebaseReward(depositId);
        depositInfo.withdrawed = true;
        lpDeposits[msg.sender] = lpDeposits[msg.sender].sub(depositInfo.amount);
        totalLpLocked = totalLpLocked.sub(depositInfo.amount);

        emit onWithdraw(msg.sender, depositInfo.amount, depositId);
    }

    function multiWithdraw(uint256[] calldata depositIds, uint256[] calldata fundingIds) external {
        require(depositIds.length == fundingIds.length, 'incorrect length');
        for (uint256 i = 0; i < depositIds.length; i += 1) {
            withdraw(depositIds[i], fundingIds[i]);
        }
    }

    /**
     * @notice Function to set how much reward the stabilizer will request
     */
    function setRewardPercentage(uint256 debaseRewardPercentage_) external onlyOwner {
        debaseRewardPercentage = debaseRewardPercentage_;
        emit LogSetDebaseRewardPercentage(debaseRewardPercentage);
    }

    /**
     * @notice Function to set reward drop period
     */
    function setBlockDuration(uint256 blockDuration_) external onlyOwner {
        require(blockDuration >= 1);
        blockDuration = blockDuration_;
        emit LogSetBlockDuration(blockDuration);
    }

    /**
     * @notice Function enabled or disable pool staking,withdraw
     */
    function setPoolEnabled(bool poolEnabled_) external onlyOwner {
        poolEnabled = poolEnabled_;
        emit LogSetPoolEnabled(poolEnabled);
    }

    function setFee(uint256 _fee) external onlyOwner {
        fee = _fee;
    }

    function setDevAddr(address _devAddr) external onlyOwner {
        require (_devAddr != address(0), 'Invalid addr');
        devAddr = _devAddr;
    }

    function setLpLimit(uint256 _lpLimit) external onlyOwner {
        lpLimit = _lpLimit;
    }

    function setMaxDepositLimit(uint256 _maxDepositLimit) external onlyOwner {
        maxDepositLimit = _maxDepositLimit;
    }

    function setTotalLpLimit(uint256 _totalLpLimit) external onlyOwner {
        totalLpLimit = _totalLpLimit;
    }

    function setTotalLpLimitEnabled(bool _totalLpLimitEnabled) external onlyOwner {
        totalLpLimitEnabled = _totalLpLimitEnabled;
    }

    function setMaxDepositLimitEnabled(bool _maxDepositLimitEnabled) external onlyOwner {
        maxDepositLimitEnabled = _maxDepositLimitEnabled;
    }

    function setLockPeriod(uint256 _lockPeriod) external onlyOwner {
        lockPeriod = _lockPeriod;
    }

    function lastBlockRewardApplicable() internal view returns (uint256) {
        return Math.min(block.number, periodFinish);
    }

    function debaseRewardPerToken() public view returns (uint256) {
        if (totalLpLocked == 0) {
            return debaseRewardPerTokenStored;
        }
        return
            debaseRewardPerTokenStored.add(
                lastBlockRewardApplicable()
                    .sub(lastUpdateBlock)
                    .mul(debaseRewardRate)
                    .mul(10**18)
                    .div(totalLpLocked)
            );
    }

    function earned(uint256 depositId) public view returns (uint256) {
        require (depositId < depositLength, 'no deposit');
        return
            deposits[depositId].amount
                .mul(debaseRewardPerToken().sub(deposits[depositId].debaseRewardPerTokenPaid))
                .div(10**18)
                .add(deposits[depositId].debaseReward);
    }

    function _payDebaseReward(uint256 depositId) internal {
        uint256 reward = earned(depositId);
        if (reward > 0) {
            deposits[depositId].debaseReward = 0;

            uint256 rewardToClaim =
                debase.totalSupply().mul(reward).div(10**18);

            debase.safeTransfer(deposits[depositId].owner, rewardToClaim.add(deposits[depositId].debaseGonAmount.div(_gonsPerFragment())));
            debaseRewardDistributed = debaseRewardDistributed.add(reward);
        }
    }

    function startNewDistribtionCycle() internal {
        _updateDebaseReward(depositLength);
        uint256 poolTotalShare =
            (debase.balanceOf(address(this)).div(debase.totalSupply())).mul(
                10**18
            );

        if (block.timestamp >= periodFinish) {
            debaseRewardRate = poolTotalShare.div(blockDuration);
        } else {
            uint256 remaining = periodFinish.sub(block.timestamp);
            uint256 leftover = remaining.mul(debaseRewardRate);
            debaseRewardRate = poolTotalShare.add(leftover).div(blockDuration);
        }
        lastUpdateBlock = block.timestamp;
        periodFinish = block.timestamp.add(blockDuration);
    }
}
