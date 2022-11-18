// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { ethers } = require("hardhat");
const hre = require("hardhat");

async function main() {

  // Existing ERC721 token contract whose tokens will act as Vault keys.
  const ERC721KeyContractAddress = "" //MUST BE SET

  // Deploys the Vault implementation contract that will be used by the VaultFactory to clone.
  const VaultImplementation = await ethers.getContractFactory("Vault");
  const vaultImplementation = await VaultImplementation.deploy();

  // Deploys the VaultFactory implementation contract, then deploys an instance of the ERC1967 proxy contract that points to the implementation, and calls the initialize function on the proxy.
  const VaultFactory = await ethers.getContractFactory("VaultFactory");
  const vaultFactory = await upgrades.deployProxy(VaultFactory, [vaultImplementation.address, ERC721KeyContractAddress], { kind: 'uups' });

  const vaultFactoryImplementationAddress = await upgrades.erc1967.getImplementationAddress(vaultFactory.address);

  // Print deployed contract addresses
  console.log(
    `Deployed:
        Vault Implementation - ${vaultImplementation.address}
        Vault Factory Implementation - ${vaultFactoryImplementationAddress}
        Vault Factory - ${vaultFactory.address}
    `
  )

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
