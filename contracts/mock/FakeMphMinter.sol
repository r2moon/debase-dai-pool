pragma solidity >=0.6.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./TestERC20.sol";
import "./Vesting.sol";

contract FakeMphMinter {

    TestERC20 public mph;
    Vesting public vesting;

    uint mphMintRate = 5;

    constructor(TestERC20 _mph, Vesting _vesting) public {
        mph = _mph;
        vesting = _vesting;
    }

    function mintDepositorReward(
        address to,
        uint256 depositAmount,
        uint256 depositPeriodInSeconds
    ) external returns (uint256) {
        uint depositorReward = depositAmount * mphMintRate / 10;
        if (depositorReward == 0) {
            return 0;
        }

        // mint and vest depositor reward
        mph.mint(address(this), depositorReward);
        uint256 vestPeriodInSeconds = 7 days;
        if (vestPeriodInSeconds == 0) {
            // no vesting, transfer to `to`
            mph.transfer(to, depositorReward);
        } else {
            // vest the MPH to `to`
            mph.increaseAllowance(address(vesting), depositorReward);
            vesting.vest(to, depositorReward, vestPeriodInSeconds);
        }

        return depositorReward;
    }

    function takeBackDepositorReward(
        address from,
        uint256 mintMPHAmount,
        bool early
    ) external returns (uint256) {
        uint256 takeBackAmount = early ? mintMPHAmount : mintMPHAmount * 30 / 100;
        if (takeBackAmount == 0) {
            return 0;
        }

        mph.transferFrom(from, address(this), takeBackAmount);
        mph.burn(address(this), takeBackAmount);

        return takeBackAmount;
    }
}
