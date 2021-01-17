pragma solidity >=0.6.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestERC20 is ERC20 {
    mapping (address => bool) public minters;

    constructor(uint supply, string memory name, string memory symbol) public ERC20(name, symbol) {
        _mint(msg.sender, supply);
    }

    function mint(address account, uint256 amount) external {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) external {
        _burn(account, amount);
    }
}
