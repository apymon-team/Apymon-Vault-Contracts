// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import "@openzeppelin/contracts/proxy/Clones.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "../IVault.sol";
import "../IVaultFactory.sol";

contract VaultFactoryMockUpgrade is IVaultFactory, UUPSUpgradeable, OwnableUpgradeable {
    address public VAULT_IMPLEMENTATION_CONTRACT;
    address public VAULT_KEY_CONTRACT;

    mapping(uint256 => address) internal vaults;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address vaultImplementationContract,
        address vaultKeyContract
    ) external override initializer {
        __Ownable_init();
        VAULT_IMPLEMENTATION_CONTRACT = vaultImplementationContract;
        VAULT_KEY_CONTRACT = vaultKeyContract;
    }

    function mockNewImplementation(
        address newVaultImplementation
    ) external onlyOwner {
        VAULT_IMPLEMENTATION_CONTRACT = newVaultImplementation;
    }

    function createVault(uint256 vaultKeyTokenId)
        external
        returns (address vault)
    {
        require(
            vaults[vaultKeyTokenId] == address(0),
            "Vault key is already associated with a vault."
        );

        require(
            msg.sender == IERC721(VAULT_KEY_CONTRACT).ownerOf(vaultKeyTokenId),
            "Caller does not own the provided vault key."
        );

        vault = _createVault(vaultKeyTokenId);
        vaults[vaultKeyTokenId] = vault;

        emit CreateVault(vaultKeyTokenId, vault);

        return vault;
    }

    function vaultOf(uint256 vaultKeyTokenId)
        external
        view
        returns (address vault)
    {
        return vaults[vaultKeyTokenId];
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function _createVault(uint256 vaultKeyTokenId)
        internal
        returns (address vault)
    {
        vault = Clones.clone(VAULT_IMPLEMENTATION_CONTRACT);
        IVault(vault).initialize(VAULT_KEY_CONTRACT, vaultKeyTokenId);

        return address(vault);
    }
}
