pragma solidity >=0.6.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./FakeMphMinter.sol";
import "./TestERC20.sol";

contract FakeDInterest {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    struct FakeDepositInfo {
        address owner;
        uint256 amount;
        uint256 maturationTimestamp;
        uint256 mintMPHAmount;
        bool withdrawn;
    }

    IERC20 public stableToken;
    FakeMphMinter public mphMinter;

    FakeDepositInfo[] deposits;
    uint nextInterest;
    uint mphMintRate = 5;

    constructor(IERC20 _stableToken, FakeMphMinter _mphMinter) public {
        stableToken = _stableToken;
        mphMinter = _mphMinter;
    }

    // TestERC20 
    function deposit(uint256 amount, uint256 maturationTimestamp) external {
        uint256 depositPeriod = maturationTimestamp.sub(now);

        uint256 mintMPHAmount = mphMinter.mintDepositorReward(
            msg.sender,
            amount,
            depositPeriod
        );

        deposits.push(
            FakeDepositInfo({
                owner: msg.sender,
                amount: amount,
                maturationTimestamp: maturationTimestamp,
                mintMPHAmount: mintMPHAmount,
                withdrawn: false
            })
        );

        stableToken.safeTransferFrom(msg.sender, address(this), amount);
    }

    function withdraw(uint256 depositId, uint256 fundingId) external {
        FakeDepositInfo storage info = deposits[depositId - 1];
        require(info.withdrawn == false, 'DInterest: Deposit not active');
        require(info.maturationTimestamp <= now, 'DInterest: Deposit not mature');
        require(info.owner == msg.sender, "DInterest: Sender doesn't own depositNFT");

        info.withdrawn = true;
        mphMinter.takeBackDepositorReward(
            msg.sender,
            info.mintMPHAmount,
            false
        );

        stableToken.safeTransfer(msg.sender, info.amount + nextInterest);
    }

    function setNextInterest(uint256 amount) external {
        stableToken.safeTransferFrom(msg.sender, address(this), amount);
        nextInterest = amount;
    }

    function depositsLength() external view returns (uint256) {
        return deposits.length;
    }
}
