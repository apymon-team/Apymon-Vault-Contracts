// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { ethers, network, run } = require("hardhat");
const hre = require("hardhat");

async function main() {

	const [deployer] = await ethers.getSigners();

	console.log(`\nDeploying Vault Contracts as ${deployer.address} on ${hre.network.name}!`);

	// Existing ERC721 token contract whose tokens will act as Vault keys.
	const ERC721KeyContractAddress = "";  //MUST BE SET

	if (ERC721KeyContractAddress == "") {
		console.error('\tThe address of the ERC721 key token contract must be set!')
		process.exit()
	}

	// Deploys the Vault implementation contract that will be used by the VaultFactory to clone.
	const VaultImplementation = await ethers.getContractFactory("Vault");
	const vaultImplementation = await VaultImplementation.deploy();
	await vaultImplementation.deployTransaction.wait(1);
	console.log(`\tDeployed Vault Implementation at ${vaultImplementation.address}`);

	// Deploys the VaultFactory implementation contract, then deploys an instance of the ERC1967 proxy contract that points to the implementation, and calls the initialize function on the proxy.
	const VaultFactory = await ethers.getContractFactory("VaultFactory");
	const vaultFactory = await upgrades.deployProxy(VaultFactory, [vaultImplementation.address, ERC721KeyContractAddress], { kind: 'uups' });
	await vaultFactory.deployTransaction.wait(6);

	const vaultFactoryImplementationAddress = await upgrades.erc1967.getImplementationAddress(vaultFactory.address);
	console.log(`\tDeployed Vault Factory Implementation at ${vaultFactoryImplementationAddress}`);
	console.log(`\tDeployed Vault Factory (Proxy) at ${vaultFactory.address}`);

	// Verify contracts on Etherscan
	// console.log('\nVerifying contracts on Etherscan...')
	// await run(`verify:verify`, { address: vaultImplementation.address });
	// await run(`verify:verify`, { address: vaultFactoryImplementationAddress });

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});




