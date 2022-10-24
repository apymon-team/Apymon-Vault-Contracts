require("@nomicfoundation/hardhat-toolbox");
require('@openzeppelin/hardhat-upgrades');

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.17",
        settings: {
          optimizer: {
            enabled: true,
            runs: 300,
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
};
