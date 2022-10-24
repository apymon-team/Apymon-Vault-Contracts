// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ERC1155Token is ERC1155, Ownable {
    constructor() ERC1155("T1155 #{id}") {}

    function mintTo(
        address recipient,
        uint256 itemId,
        uint256 amount
    ) public onlyOwner {
        _mint(recipient, itemId, amount, "");
    }
}
