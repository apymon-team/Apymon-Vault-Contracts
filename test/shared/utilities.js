const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

async function deployContracts() {

    // Wallets
    const [vaultTeam, tokenTeam, userA, userB, userC] = await ethers.getSigners();

    // Tokens
    const ERC721Key = await ethers.getContractFactory("ERC721Token");
    const ERC20Token = await ethers.getContractFactory("ERC20Token");
    const ERC721Token = await ethers.getContractFactory("ERC721Token");
    const ERC1155Token = await ethers.getContractFactory("ERC1155Token");
    const CryptoPunksToken = await ethers.getContractFactory("CryptoPunksMarket");

    const erc721Key = await ERC721Key.connect(tokenTeam).deploy("Key721", "K721");
    const cryptoPunksToken = await CryptoPunksToken.connect(tokenTeam).deploy();
    const erc20Token = await ERC20Token.connect(tokenTeam).deploy("Test20", "T20");
    const erc721Token = await ERC721Token.connect(tokenTeam).deploy("Test721", "T721");
    const erc1155Token = await ERC1155Token.connect(tokenTeam).deploy();

    // Vault Contracts

    //// Deploys a Vault implementation contract that will be used by the VaultFactory to clone.
    const VaultImplementation = await ethers.getContractFactory("Vault");
    const vaultImplementation = await VaultImplementation.connect(vaultTeam).deploy();

    //// Deploys an VaultFactory implementation contract, then deploys an instance of the ERC1967 proxy contract that points to the implementation, and calls the initialize function on the proxy.
    const VaultFactory = await ethers.getContractFactory("VaultFactory");
    const vaultFactory = await upgrades.deployProxy(VaultFactory.connect(vaultTeam), [vaultImplementation.address, erc721Key.address], { kind: 'uups' });

    const vaultFactoryImplementationAddress = await upgrades.erc1967.getImplementationAddress(vaultFactory.address);

    const VaultFactoryImplementation = await ethers.getContractFactory("VaultFactory");
    const vaultFactoryImplementation = await VaultFactoryImplementation.attach(vaultFactoryImplementationAddress);


    // User A - Key Token #1 & Tokens Owner
    // User B - Key Token #2 & Tokens Owner
    // User C - Owns nothing and is happy?

    await erc721Key.connect(tokenTeam).mintTo(userA.address); //#1
    await erc721Key.connect(tokenTeam).mintTo(userB.address); //#2
    await erc20Token.connect(tokenTeam).mintTo(userA.address, 1);
    await erc20Token.connect(tokenTeam).mintTo(userB.address, 1);
    await erc721Token.connect(tokenTeam).mintTo(userA.address); //#1
    await erc721Token.connect(tokenTeam).mintTo(userB.address); //#2
    await erc1155Token.connect(tokenTeam).mintTo(userA.address, 1, 1);
    await erc1155Token.connect(tokenTeam).mintTo(userB.address, 2, 1);
    await cryptoPunksToken.connect(tokenTeam).setInitialOwner(userA.address, 1); //#1
    await cryptoPunksToken.connect(tokenTeam).setInitialOwner(userB.address, 2); //#2
    await cryptoPunksToken.connect(tokenTeam).allInitialOwnersAssigned();

    return { vaultTeam, tokenTeam, userA, userB, userC, erc721Key, erc20Token, erc721Token, erc1155Token, cryptoPunksToken, vaultFactory, vaultImplementation, vaultFactoryImplementation };
}

const TokenType = {
    ETH: 0,
    ERC20: 1,
    ERC721: 2,
    ERC1155: 3,
    CryptoPunk: 4
}

module.exports = {
    deployContracts,
    TokenType
};