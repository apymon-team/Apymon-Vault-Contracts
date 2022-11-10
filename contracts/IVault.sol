// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IVault {
    event WithdrawETH(
        address indexed operator,
        address indexed recipient,
        uint256 amount
    );
    event WithdrawERC20(
        address indexed operator,
        address indexed token,
        address recipient,
        uint256 amount
    );

    event WithdrawERC721(
        address indexed operator,
        address indexed token,
        uint256 tokenId,
        address recipient
    );

    event WithdrawERC1155(
        address indexed operator,
        address indexed token,
        uint256 tokenId,
        address recipient,
        uint256 amount
    );

    event WithdrawCryptoPunk(
        address indexed operator,
        address indexed token,
        uint256 tokenId,
        address recipient
    );

    event VaultLocked(uint256 timeLockUntil);
    event VaultUnlocked(string message);

    function initialize(address vaultKeyContract, uint256 vaultKeyTokenId)
        external;
    
    function lock(string message) external;
    function timelock(string message, uint256 timeLockUntil);
    function unlock() returns string;

    function withdrawETH(address to, uint256 amount) external;

    function withdrawERC20(
        address token,
        address to,
        uint256 amount
    ) external;

    function withdrawERC721(
        address token,
        uint256 tokenId,
        address to
    ) external;

    function withdrawERC1155(
        address token,
        uint256 tokenId,
        address to,
        uint256 amount
    ) external;

    function withdrawCryptoPunk(
        address punks,
        uint256 punkIndex,
        address to
    ) external;

    function withdrawMultiple(TokenWithdraw[] calldata tokens, address to)
        external;

    function keyOwner() external view returns (address);
    function locked() external view returns (bool);
    function unlockable() external view returns (bool);

    enum TokenType {
        ETH,
        ERC20,
        ERC721,
        ERC1155,
        CryptoPunk
    }

    struct TokenWithdraw {
        TokenType tokenType;
        address token;
        uint256 tokenId;
        uint256 amount;
    }
}
