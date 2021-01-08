pragma solidity >=0.6.6;

interface IVesting {
    function withdrawVested(address account, uint256 vestIdx) external returns (uint256);
    function getVestWithdrawableAmount(address account, uint256 vestIdx) external view returns (uint256);
}
