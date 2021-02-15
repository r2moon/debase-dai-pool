// SPDX-License-Identifier: MIT
/*

██████╗ ███████╗██████╗  █████╗ ███████╗███████╗
██╔══██╗██╔════╝██╔══██╗██╔══██╗██╔════╝██╔════╝
██║  ██║█████╗  ██████╔╝███████║███████╗█████╗  
██║  ██║██╔══╝  ██╔══██╗██╔══██║╚════██║██╔══╝  
██████╔╝███████╗██████╔╝██║  ██║███████║███████╗
╚═════╝ ╚══════╝╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝
                                               

* Debase: DaiLpPoolV2.sol
* Description:
* Farm DEBASE-DAI Uni V2 LP token to get DEBASE, DAI, MPH rewards.
*   Get MPH reward 7 days after deposit
*   Get DEBASE, DAI reward after unlocked
* Coded by: Ryuhei Matsuda
*/

pragma solidity >=0.6.6;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IUniswapV2Pair.sol";
import "./interfaces/IDInterest.sol";

struct Vest {
    uint256 amount;
    uint256 vestPeriodInSeconds;
    uint256 creationTimestamp;
    uint256 withdrawnAmount;
}

interface IVesting {
    function withdrawVested(address account, uint256 vestIdx) external returns (uint256);
    function getVestWithdrawableAmount(address account, uint256 vestIdx) external view returns (uint256);
    function accountVestList(address account, uint256 vestIdx) external view returns (Vest memory);
}

contract DaiLpPoolV2 is Ownable, IERC721Receiver, ReentrancyGuard {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    event onDeposit(address indexed user, uint256 amount, uint256 maturationTimestamp, uint256 depositId);
    event onWithdraw(address indexed user, uint256 amount, uint256 depositId);
    event onWithdrawMphVested(address indexed user, uint256 amount, uint256 depositId);

    event LogSetDebaseRewardPercentage(uint256 debaseRewardPercentage_);
    event LogDebaseRewardIssued(uint256 rewardIssued, uint256 rewardsFinishBy);
    event LogSetBlockDuration(uint256 duration_);
    event LogSetPoolEnabled(bool poolEnabled_);
    event LogStartNewDistribtionCycle(
        uint256 poolShareAdded_,
        uint256 amount_,
        uint256 rewardRate_,
        uint256 periodFinish_
    );

    struct DepositInfo {
        address owner;
        uint256 amount;
        uint256 daiAmount;
        uint256 debaseGonAmount;
        uint256 debaseReward;
        uint256 debaseRewardPerTokenPaid;
        uint256 daiDepositId;
        uint256 mphReward;
        uint256 mphVestingIdx;
        uint256 maturationTimestamp;
        bool withdrawed;
    }

    uint256 private constant MAX_UINT256 = ~uint256(0);
    uint256 private constant INITIAL_FRAGMENTS_SUPPLY = 1000000 * 10**18;
    uint256 private constant TOTAL_GONS = MAX_UINT256 - (MAX_UINT256 % INITIAL_FRAGMENTS_SUPPLY);

    IUniswapV2Pair public debaseDaiPair;
    IDInterest public daiFixedPool;
    IVesting public mphVesting;
    IERC20 public dai;
    IERC20 public debase;
    IERC20 public mph;
    address public policy;

    uint256 public maxDepositLimit;
    uint256 public totalLpLimit;
    uint256 public lockPeriod;
    bool public totalLpLimitEnabled;
    bool public maxDepositLimitEnabled;

    uint256 public totalLpLocked;

    mapping (uint256 => DepositInfo) public deposits;
    mapping (address => uint256[]) public depositIds;

    mapping (address => uint256) public lpDeposits;
    uint256 public depositLength;
    uint256 public daiFee = 300;
    uint256 public mphFee = 300;
    uint256 public mphTakeBackMultiplier = 300000000000000000;
    address public treasury;

    uint256 public periodFinish;
    uint256 public debaseRewardRate;
    uint256 public lastUpdateBlock;
    uint256 public debaseRewardPerTokenStored;
    uint256 public debaseRewardPercentage;
    uint256 public debaseRewardDistributed;
    uint256 lastVestingIdx;
    uint256 firstDepositForVesting;

    // params for debase reward
    uint256 public blockDuration;
    bool public poolEnabled;

    modifier enabled() {
        require(poolEnabled, "Pool isn't enabled");
        _;
    }

    function _updateDebaseReward(uint256 depositId) internal {
        debaseRewardPerTokenStored = debaseRewardPerToken();
        lastUpdateBlock = _lastBlockRewardApplicable();
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
        IVesting _mphVesting,
        uint256 _lockPeriod,
        address _treasury,
        uint256 _debaseRewardPercentage,
        uint256 _blockDuration
    ) public Ownable() {
        require (_treasury != address(0), 'Invalid addr');
        debaseDaiPair = _debaseDaiPair;
        dai = _dai;
        debase = _debase;
        mph = _mph;
        policy = _policy;
        daiFixedPool = _daiFixedPool;
        mphVesting = _mphVesting;
        lockPeriod = _lockPeriod;
        treasury = _treasury;
        debaseRewardPercentage = _debaseRewardPercentage;
        blockDuration = _blockDuration;
    }

    function _depositLpToken(uint256 amount) internal returns (uint256 daiAmount, uint256 debaseAmount) {
        uint daiOldBalance = dai.balanceOf(address(this));
        uint debaseOldBalance = debase.balanceOf(address(this));
        debaseDaiPair.transferFrom(msg.sender, address(debaseDaiPair), amount);
        debaseDaiPair.burn(address(this));
        uint daiBalance = dai.balanceOf(address(this));
        uint debaseBalance = debase.balanceOf(address(this));

        daiAmount = daiBalance.sub(daiOldBalance);
        debaseAmount = debaseBalance.sub(debaseOldBalance);
    }

    function _depositDai(uint daiAmount) internal returns (uint256 daiDepositId, uint256 maturationTimestamp) {
        maturationTimestamp = block.timestamp.add(lockPeriod);
        dai.approve(address(daiFixedPool), daiAmount);
        daiFixedPool.deposit(daiAmount, maturationTimestamp);
        daiDepositId = daiFixedPool.depositsLength();
    }

    function _getCurrentVestingIdx() internal view returns (uint256) {
        uint256 vestIdx = lastVestingIdx;
        Vest memory vest = mphVesting.accountVestList(address(this), vestIdx);
        while (vest.creationTimestamp < block.timestamp) {
            vestIdx = vestIdx.add(1);
            vest = mphVesting.accountVestList(address(this), vestIdx);
        }
        return vestIdx;
    }

    function _withdrawMphVested(uint256 depositId) internal {
        require (depositId < depositLength, 'no deposit');
        DepositInfo storage depositInfo = deposits[depositId];
        require (depositInfo.owner == msg.sender, 'not owner');

        uint256 _vestingIdx = depositInfo.mphVestingIdx;

        Vest memory vest = mphVesting.accountVestList(address(this), _vestingIdx);
        require(block.timestamp >= vest.creationTimestamp.add(vest.vestPeriodInSeconds), "Not ready to withdarw mph");
        uint256 vested = mphVesting.withdrawVested(address(this), _vestingIdx);

        if (vested > 0) {
            deposits[depositId].mphReward = deposits[depositId].mphReward.add(vested);
            uint takeBackAmount = vested.mul(mphTakeBackMultiplier).div(1e18);
            uint mphVested = vested.sub(takeBackAmount);
            uint mphFeeAmount = mphVested.mul(mphFee).div(1000);
            mph.transfer(depositInfo.owner, mphVested.sub(mphFeeAmount));
            mph.transfer(treasury, mphFeeAmount);

            emit onWithdrawMphVested(depositInfo.owner, mphVested, depositId);
        }
    }

    function deposit(uint256 amount)
        external
        enabled
        nonReentrant
        returns (uint256)
    {
        require(totalLpLimitEnabled == false || totalLpLocked.add(amount) <= totalLpLimit, 'To much lp locked');
        require(maxDepositLimitEnabled == false || lpDeposits[msg.sender].add(amount) <= maxDepositLimit, 'to much deposit for this user');

        (uint daiAmount, uint debaseAmount) = _depositLpToken(amount);
        (uint daiDepositId, uint maturationTimestamp) = _depositDai(daiAmount);

        lpDeposits[msg.sender] = lpDeposits[msg.sender].add(amount);
        totalLpLocked = totalLpLocked.add(amount);

        uint256 vestingIdx = _getCurrentVestingIdx();

        deposits[depositLength] = DepositInfo({
            owner: msg.sender,
            amount: amount,
            daiAmount: daiAmount,
            debaseGonAmount: debaseAmount.mul(_gonsPerFragment()),
            debaseReward: 0,
            debaseRewardPerTokenPaid: 0,
            daiDepositId: daiDepositId,
            maturationTimestamp: maturationTimestamp,
            mphReward: 0,
            mphVestingIdx: vestingIdx,
            withdrawed: false
        });
        depositIds[msg.sender].push(depositLength);

        lastVestingIdx = vestingIdx.add(1);
        depositLength = depositLength.add(1);

        _updateDebaseReward(daiDepositId);
        emit onDeposit(msg.sender, amount, maturationTimestamp, depositLength.sub(1));
        return depositLength.sub(1);
    }

    function userDepositLength(address user) external view returns (uint256) {
        return depositIds[user].length;
    }

    function _gonsPerFragment() internal view returns (uint256) {
        return TOTAL_GONS.div(debase.totalSupply());
    }

    function _withdrawDai(uint256 depositId, uint256 fundingId) internal {
        DepositInfo storage depositInfo = deposits[depositId];

        uint mphBalance = mph.balanceOf(address(this));
        mph.approve(address(daiFixedPool.mphMinter()), mphBalance);
        uint daiOldBalance = dai.balanceOf(address(this));
        daiFixedPool.withdraw(depositInfo.daiDepositId, fundingId);
        mph.approve(address(daiFixedPool.mphMinter()), 0);

        uint daiBalance = dai.balanceOf(address(this));
        uint daiReward = daiBalance.sub(daiOldBalance).sub(depositInfo.daiAmount);

        uint daiFeeAmount = daiReward.mul(daiFee).div(1000);

        dai.transfer(depositInfo.owner, depositInfo.daiAmount.add(daiReward.sub(daiFeeAmount)));
        dai.transfer(treasury, daiFeeAmount);
    }

    function _withdraw(address user, uint256 depositId, uint256 fundingId) internal
    {
        require (depositId < depositLength, 'no deposit');
        DepositInfo storage depositInfo = deposits[depositId];
        require (depositInfo.owner == user, 'not owner');
        require (depositInfo.withdrawed == false, 'withdrawed already');
        require (depositInfo.maturationTimestamp <= block.timestamp, 'still locked');

        _withdrawMphVested(depositId);
        _withdrawDai(depositId, fundingId);
        _withdrawDebase(depositId);
        depositInfo.withdrawed = true;
        lpDeposits[user] = lpDeposits[user].sub(depositInfo.amount);
        totalLpLocked = totalLpLocked.sub(depositInfo.amount);

        emit onWithdraw(user, depositInfo.amount, depositId);
    }

    function withdraw(uint256 depositId, uint256 fundingId) external nonReentrant
    {
        _withdraw(msg.sender, depositId, fundingId);
    }

    function multiWithdraw(uint256[] calldata depositIds, uint256[] calldata fundingIds) external nonReentrant {
        require(depositIds.length == fundingIds.length, 'incorrect length');
        for (uint256 i = 0; i < depositIds.length; i += 1) {
            _withdraw(msg.sender, depositIds[i], fundingIds[i]);
        }
    }

    function withdrawMphVested(uint256 depositId) external nonReentrant 
    {
        _withdrawMphVested(depositId);
    }

    function multiWithdrawMphVested(uint256[] calldata depositIds) external nonReentrant {
        for (uint256 i = 0; i < depositIds.length; i += 1) {
            _withdrawMphVested(depositIds[i]);
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
        require(blockDuration_ >= 1, 'invalid duration');
        blockDuration = blockDuration_;
        emit LogSetBlockDuration(blockDuration);
    }

    /**
     * @notice Function enabled or disable pool deposit
     */
    function setPoolEnabled(bool poolEnabled_) external onlyOwner {
        poolEnabled = poolEnabled_;
        emit LogSetPoolEnabled(poolEnabled);
    }

    function setDaiFee(uint256 _daiFee) external onlyOwner {
        daiFee = _daiFee;
    }

    function setMphFee(uint256 _mphFee) external onlyOwner {
        mphFee = _mphFee;
    }

    function setMphTakeBackMultiplier(uint256 _mphTakeBackMultiplier) external onlyOwner {
        mphTakeBackMultiplier = _mphTakeBackMultiplier;
    }

    function setTreasury(address _treasury) external onlyOwner {
        require (_treasury != address(0), 'Invalid addr');
        treasury = _treasury;
    }

    function setPolicy(address _policy) external onlyOwner {
        require (_policy != address(0), 'Invalid addr');
        policy = _policy;
    }

    function setMaxDepositLimit(uint256 _maxDepositLimit) external onlyOwner {
        maxDepositLimit = _maxDepositLimit;
    }

    function setMaxDepositLimitEnabled(bool _maxDepositLimitEnabled) external onlyOwner {
        maxDepositLimitEnabled = _maxDepositLimitEnabled;
    }

    function setTotalLpLimit(uint256 _totalLpLimit) external onlyOwner {
        totalLpLimit = _totalLpLimit;
    }

    function setTotalLpLimitEnabled(bool _totalLpLimitEnabled) external onlyOwner {
        totalLpLimitEnabled = _totalLpLimitEnabled;
    }

    function setLockPeriod(uint256 _lockPeriod) external onlyOwner {
        require (_lockPeriod > 0, 'invalid lock period');
        lockPeriod = _lockPeriod;
    }

    function _lastBlockRewardApplicable() internal view returns (uint256) {
        return Math.min(block.number, periodFinish);
    }

    function debaseRewardPerToken() public view returns (uint256) {
        if (totalLpLocked == 0) {
            return debaseRewardPerTokenStored;
        }
        return
            debaseRewardPerTokenStored.add(
                _lastBlockRewardApplicable()
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

    function _withdrawDebase(uint256 depositId) internal {
        _updateDebaseReward(depositId);
        uint256 reward = earned(depositId);
        deposits[depositId].debaseReward = 0;

        uint256 rewardToClaim = debase.totalSupply().mul(reward).div(10**18);

        debase.safeTransfer(deposits[depositId].owner, rewardToClaim.add(deposits[depositId].debaseGonAmount.div(_gonsPerFragment())));
        debaseRewardDistributed = debaseRewardDistributed.add(reward);
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
                startNewDistribtionCycle(rewardToClaim);
                return rewardToClaim;
            }
        }
        return 0;
    }

    function startNewDistribtionCycle(uint256 amount) internal
    {
        _updateDebaseReward(depositLength);
        uint256 poolTotalShare = amount.mul(10**18).div(debase.totalSupply());

        if (block.number >= periodFinish) {
            debaseRewardRate = poolTotalShare.div(blockDuration);
        } else {
            uint256 remaining = periodFinish.sub(block.number);
            uint256 leftover = remaining.mul(debaseRewardRate);
            debaseRewardRate = poolTotalShare.add(leftover).div(blockDuration);
        }
        lastUpdateBlock = block.number;
        periodFinish = block.number.add(blockDuration);

        emit LogStartNewDistribtionCycle(
            poolTotalShare,
            amount,
            debaseRewardRate,
            periodFinish
        );
    }

    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external override returns (bytes4) {
        return 0x150b7a02;
    }
}
