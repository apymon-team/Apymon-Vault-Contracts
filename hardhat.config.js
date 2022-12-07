require("@nomicfoundation/hardhat-toolbox");
require('@openzeppelin/hardhat-upgrades');
require("@nomiclabs/hardhat-etherscan");
require("dotenv").config()

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
	solidity: {
		compilers: [
			{
				version: "0.8.17",
				settings: {
					optimizer: {
						enabled: true,
						runs: 200,
					}
				}
			},
			{
				version: "0.4.11"
			}
		],
	},
	gasReporter: {
		enabled: true,
		currency: 'USD',
		gasPrice: 30
	},
	networks: {
		goerli: {
			url: process.env.GOERLI_RPC_URL,
			accounts: {
				mnemonic: process.env.GOERLI_MNEMONIC
			},
			gasPrice: 1000000000
		}
	},
	etherscan: {
		apiKey: {
			goerli: process.env.ETHERSCAN_API_KEY
		}
	}

};
