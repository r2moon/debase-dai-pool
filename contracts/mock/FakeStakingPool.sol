pragma solidity >=0.6.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./FakeMphMinter.sol";
import "./TestERC20.sol";

contract LPTokenWrapper {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IERC20 public stakeToken;

    uint256 private _totalSupply;

    mapping(address => uint256) private _balances;

    constructor(address _stakeToken) public {
        stakeToken = IERC20(_stakeToken);
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    function stake(uint256 amount) virtual public {
        _totalSupply = _totalSupply.add(amount);
        _balances[msg.sender] = _balances[msg.sender].add(amount);
        stakeToken.safeTransferFrom(msg.sender, address(this), amount);
    }

    function withdraw(uint256 amount) virtual public {
        _totalSupply = _totalSupply.sub(amount);
        _balances[msg.sender] = _balances[msg.sender].sub(amount);
        stakeToken.safeTransfer(msg.sender, amount);
    }
}

contract FakeStakingPool is LPTokenWrapper {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IERC20 public rewardToken;

    uint nextReward;

    constructor(address _stakeToken, IERC20 _rewardToken) public LPTokenWrapper(_stakeToken) {
        rewardToken = _rewardToken;
    }

    function stake(uint256 amount) override public {
        require(amount > 0, "Rewards: cannot stake 0");
        super.stake(amount);
    }

    function withdraw(uint256 amount) override public
    {
        require(amount > 0, "Rewards: cannot withdraw 0");
        super.withdraw(amount);
    }

    function getReward() public {
        uint256 reward = nextReward;
        if (reward > 0) {
            rewardToken.safeTransfer(msg.sender, reward);
        }
    }

    function setNextReward(uint256 amount) external {
        rewardToken.safeTransferFrom(msg.sender, address(this), amount);
        nextReward = amount;
    }
}
