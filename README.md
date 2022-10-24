# Apymon Vault 

This repository contains the smart contracts for the latest Apymon Vault. These contracts work together to allow users to create Vaults that can handle ETH, ERC20, ERC721, ERC1155, and CryptoPunk tokens and whose ownership is directly tied to a ERC721 token that act as the key. Transfering ownership of the key token therefore transfers ownership of the entire Vault and it's contents. Vaults can also be timelocked with public notes to disable withdraws for a given duration.

## Contracts

### Vault Factory

The Vault Factory is tied to an ERC721 token contract and allows a Vault to be created for a given token by it's owner. Each token can create a single Vault instance. Vault addresses are stored by the Vault Factory upon creation.

### Vault

Each Vault deployment allows for the management of ETH, ERC20, ERC721, ERC1155, and CryptoPunk tokens by the owner of the Vault. Upon creation, the ownership of a Vault is immutuably tied to a key ERC721 token. The key owner can withdraw tokens and timelock the Vault.

## Testing
```shell
npx hardhat help
npx hardhat test
npx hardhat coverage
```
