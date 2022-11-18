# Apymon Vaults (ERC721 Controlled Vaults)

This repository contains the smart contracts for the latest Apymon Vaults. These contracts work together to allow users to create Vaults that can handle ETH, ERC20, ERC721, ERC1155, and CryptoPunk tokens and whose ownership is directly tied to an existing ERC721 token that acts as a key. Transfering ownership of the key token therefore transfers ownership of the entire Vault and it's contents. Vaults can also be timelocked with public notes to disable withdraws for a given duration.

Check out [ERC721 Controlled Vaults](./docs/ERC721_Controlled_Vaults.pdf) for more information about the design.

## Contracts
A quick rundown of the Vault and Vault Factory contracts is described below. In addition to these contracts you'll find some basic implementations of the supported token types and mock contracts that are used in testing.
### Vault Factory
The Vault Factory is tied to an ERC721 token contract and allows a Vault to be created for a given token by it's owner. Each token can create a single Vault instance. Vault addresses are stored by the Vault Factory upon creation.
### Vault
Each Vault deployment allows for the management of ETH, ERC20, ERC721, ERC1155, and CryptoPunk tokens by the owner of the Vault. Upon creation, the ownership of a Vault is immutuably tied to a key ERC721 token. The key owner can withdraw tokens and timelock the Vault.

## Testing
All of the tests are laid out in the `./test/` directory and can be run using the following commands.
```shell
npm install
npx hardhat test
npx hardhat coverage
```
