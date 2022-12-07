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

	console.log(`\nDeploying Token Contracts as ${deployer.address} on ${hre.network.name}!`);

	const ERC721Key = await ethers.getContractFactory("ERC721Token");
	const ERC20Token = await ethers.getContractFactory("ERC20Token");
	const ERC721Token = await ethers.getContractFactory("ERC721Token");
	const ERC1155Token = await ethers.getContractFactory("ERC1155Token");
	const CryptoPunksToken = await ethers.getContractFactory("CryptoPunksMarket");

	const erc721Key = await ERC721Key.deploy("Key721", "K721");
	await erc721Key.deployTransaction.wait(1);
	console.log(`\tDeployed ERC721Key at ${erc721Key.address}`);

	const erc20Token = await ERC20Token.deploy("Test20", "T20");
	await erc20Token.deployTransaction.wait(1);
	console.log(`\tDeployed ERC20Token at ${erc20Token.address}`);

	const erc721Token = await ERC721Token.deploy("Test721", "T721");
	await erc721Token.deployTransaction.wait(1);
	console.log(`\tDeployed ERC721Token at ${erc721Token.address}`);

	const erc1155Token = await ERC1155Token.deploy();
	await erc1155Token.deployTransaction.wait(1);
	console.log(`\tDeployed ERC1155Token at ${erc1155Token.address}`);

	const cryptoPunksToken = await CryptoPunksToken.deploy();
	await cryptoPunksToken.deployTransaction.wait(6);
	console.log(`\tDeployed CryptoPunksToken at ${cryptoPunksToken.address}`);

	// Verify contracts on Etherscan
	// console.log('\nVerifying contracts on Etherscan...')
	// await run(`verify:verify`, { address: erc721Key.address, constructorArguments: ["Key721", "K721"] });
	// await run(`verify:verify`, { address: erc20Token.address, constructorArguments: ["Test20", "T20"] });
	// await run(`verify:verify`, { address: erc721Token.address, constructorArguments: ["Test721", "T721"] });
	// await run(`verify:verify`, { address: erc1155Token.address });
	// await run(`verify:verify`, { address: cryptoPunksToken.address });

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});




