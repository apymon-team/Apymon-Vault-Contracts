// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./IVault.sol";
import "./IPunks.sol";

/**
 * @title Vault
 * @author Jake
 *
 * The Vault is responsible for securely handling deposits and withdraws of ETH,
 * ERC20, ERC721, ERC1155, and CryptoPunk tokens. A timelock function exists to
 * disable withdraws until after a given time. Instances of the Vault are created
 * by the VaultFactory and, upon creation, ownership is immutably tied to a specific
 * ERC721 token referred to as the key. Anyone can deposit tokens at anytime, while
 * only the Vault's key holder can withdraw or timelock the vault. This effectively
 * ties ownership of all tokens within the vault to the key token.
 *
 **/

contract Vault is
    IVault,
    ERC1155Holder,
    ERC721Holder,
    ReentrancyGuard,
    Initializable
{
    using AddressUpgradeable for address;
    using AddressUpgradeable for address payable;
    using SafeERC20 for IERC20;

    address public VAULT_FACTORY_CONTRACT;
    address public VAULT_KEY_CONTRACT;
    uint256 public VAULT_KEY_TOKEN_ID;

    uint256 public timeLockedUntil;
    bool public locked = false;
    string private message;

    // @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     *
     * @notice Initializes the Vault instance and ties it to a particular ERC721 token, referred to as the key. Cannot be called on the implementation contract and can only be called once per proxy instance.
     *
     * @param vaultKeyContract          The contract address of the ERC721 key token.
     * @param vaultKeyTokenId           The id of the token that will act as the key of the Vault.
     *
     **/

    function initialize(
        address vaultKeyContract,
        uint256 vaultKeyTokenId
    ) external override initializer {
        VAULT_FACTORY_CONTRACT = msg.sender;
        VAULT_KEY_CONTRACT = vaultKeyContract;
        VAULT_KEY_TOKEN_ID = vaultKeyTokenId;
    }

    /**
     *
     * @notice Withdraws ETH, can only be called by the key owner and when the vault is unlocked.
     *
     * @param to                    The recipient of the ETH.
     * @param amount                The amount of ETH to withdraw.
     *
     **/

    function withdrawETH(address to, uint256 amount)
        public
        override
        onlyKeyOwner
        unlocked
        nonReentrant
    {
        payable(to).sendValue(amount);
        emit WithdrawETH(msg.sender, to, amount);
    }

    /**
     *
     * @notice Withdraws an ERC20 token, can only be called by the key owner and when the vault is unlocked.
     *
     * @param token                 The contract address of the ERC20 token to withdraw.
     * @param to                    The recipient of the ERC20 token.
     * @param amount                The amount of the ERC20 token to withdraw.
     *
     **/

    function withdrawERC20(
        address token,
        address to,
        uint256 amount
    ) public override onlyKeyOwner unlocked {
        IERC20(token).safeTransfer(to, amount);
        emit WithdrawERC20(msg.sender, token, to, amount);
    }

    /**
     *
     * @notice Withdraws an ERC721 token, can only be called by the key owner and when the vault is unlocked.
     *
     * @param token                 The contract address of the ERC721 token to withdraw.
     * @param tokenId               The id of the token to withdraw.
     * @param to                    The recipient of the ERC721 token.
     *
     **/

    function withdrawERC721(
        address token,
        uint256 tokenId,
        address to
    ) public override onlyKeyOwner unlocked {
        IERC721(token).safeTransferFrom(address(this), to, tokenId);
        emit WithdrawERC721(msg.sender, token, tokenId, to);
    }

    /**
     *
     * @notice Withdraws an ERC1155 token, can only be called by the key owner and when the vault is unlocked.
     *
     * @param token                 The contract address of the ERC1155 token to withdraw.
     * @param tokenId               The id of the token to withdraw.
     * @param to                    The recipient of the ERC1155 token.
     * @param amount                The amount of the ERC1155 token to withdraw.
     *
     **/

    function withdrawERC1155(
        address token,
        uint256 tokenId,
        address to,
        uint256 amount
    ) public override onlyKeyOwner unlocked {
        IERC1155(token).safeTransferFrom(
            address(this),
            to,
            tokenId,
            amount,
            ""
        );
        emit WithdrawERC1155(msg.sender, token, tokenId, to, amount);
    }

    /**
     *
     * @notice Withdraws a CryptoPunk, can only be called by the key owner and when the vault is unlocked.
     *
     * @param punks                 The contract address of CryptoPunks.
     * @param punkIndex             The index of the CryptoPunk to withdraw.
     * @param to                    The recipient of the CryptoPunk.
     *
     **/

    function withdrawCryptoPunk(
        address punks,
        uint256 punkIndex,
        address to
    ) public override onlyKeyOwner unlocked {
        IPunks(punks).transferPunk(to, punkIndex);
        emit WithdrawCryptoPunk(msg.sender, punks, punkIndex, to);
    }

    /**
     *
     * @notice Withdraws multiple tokens at once, can only be called by the key owner and when the vault is unlocked.
     *
     * @param tokens                 An array of token withdraw information
     *
     **/

    function withdrawMultiple(TokenWithdraw[] calldata tokens, address to)
        external
        override
        onlyKeyOwner
        unlocked
    {
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i].tokenType == TokenType.ETH) {
                withdrawETH(to, tokens[i].amount);
            } else if (tokens[i].tokenType == TokenType.ERC20) {
                withdrawERC20(tokens[i].token, to, tokens[i].amount);
            } else if (tokens[i].tokenType == TokenType.ERC721) {
                withdrawERC721(tokens[i].token, tokens[i].tokenId, to);
            } else if (tokens[i].tokenType == TokenType.ERC1155) {
                withdrawERC1155(
                    tokens[i].token,
                    tokens[i].tokenId,
                    to,
                    tokens[i].amount
                );
            } else if (tokens[i].tokenType == TokenType.CryptoPunk) {
                withdrawCryptoPunk(tokens[i].token, tokens[i].tokenId, to);
            }
        }
    }

    /**
     *
     * @notice Locks the vault until the provided time has passed, can only be called by the key owner and when the vault is unlocked.
     *
     * @param _unlockTime           The timestamp of when the vault should unlock, measured in seconds since the unix epoch.
     * @param _unlockNote           The note that is emitted as a part of the LockVault event data.
     *
     **/

    function lock(string calldata _unlockNote)
        external
        onlyKeyOwner
        unlocked
    {
        message = _unlockNote;
        timeLockedUntil = block.timestamp;
        emit VaultLocked(unlockTime);
    }



    /**
     *
     * @notice Recovers the ERC721 key token to the VaultFactory contract owner, can only be called if the vault owns the key token.
     *
     **/

    function recoverKey() external {
        require(address(this) == keyOwner(), "Vault does not own the key.");
        require(
            msg.sender == OwnableUpgradeable(VAULT_FACTORY_CONTRACT).owner(),
            "Can only be called by the Vault Factory owner."
        );
        IERC721(VAULT_KEY_CONTRACT).transferFrom(
            address(this),
            OwnableUpgradeable(VAULT_FACTORY_CONTRACT).owner(),
            VAULT_KEY_TOKEN_ID
        );
    }

    /**
     *
     * @notice Returns the address of the owner of the key token.
     *
     * @return owner                The address of the owner of the key token.
     *
     **/

    function keyOwner() public view returns (address owner) {
        return IERC721(VAULT_KEY_CONTRACT).ownerOf(VAULT_KEY_TOKEN_ID);
    }

    function unlockable() public view returns (bool unlockable) {
        return block.timestamp > timeLockedUntil
    }

    /**
     *
     *  @dev Attempt to stop the transfer of the ERC721 key token to the vault.
     *
     **/

    function onERC721Received(
        address,
        address,
        uint256 tokenId,
        bytes memory
    ) public virtual override returns (bytes4) {
        require(
            !(msg.sender == VAULT_KEY_CONTRACT &&
                tokenId == VAULT_KEY_TOKEN_ID),
            "Cannot receive vault key."
        );
        return this.onERC721Received.selector;
    }

    receive() external payable {}

    /**
     *
     *  @dev Used to prevent calling any withdraw or timelock functions unless the caller owns the vault key.
     *
     **/

    modifier onlyKeyOwner() {
        require(msg.sender == keyOwner(), "Caller does not own vault key.");
        _;
    }

    /**
     *
     *  @dev Used to prevent calling any withdraws or timelock functions when the vault is locked.
     *
     **/

    modifier unlocked() {
        require(unlockable(), "Vault is currently timelocked.");
        require(locked == false, "Vault is currently Locked.");
        _;
    }
}
