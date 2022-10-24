const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

const { deployContracts } = require("./shared/utilities")

var vaultTeam, tokenTeam, userA, userB, userC, erc721Key, erc20Token, erc721Token, erc1155Token, cryptoPunksToken, vaultFactory;

describe("Deployment & Test Setup", function () {

    beforeEach('Deploy Factory & Tokens', async () => {
        ({ vaultTeam, tokenTeam, userA, userB, userC, erc721Key, erc20Token, erc721Token, erc1155Token, cryptoPunksToken, vaultFactory } = await loadFixture(deployContracts));
    })

    it("Vault Factory is owned by Vault Team", async function () {
        expect(await vaultFactory.owner()).to.equal(vaultTeam.address);
    });

    it("ERC Token Contracts are owned by Token Team", async function () {
        expect(await erc721Key.owner()).to.equal(tokenTeam.address);
        expect(await erc20Token.owner()).to.equal(tokenTeam.address);
        expect(await erc721Token.owner()).to.equal(tokenTeam.address);
        expect(await erc1155Token.owner()).to.equal(tokenTeam.address);
    });

    it("ERC721 Key Token: User A owns #1, User B owns #2", async function () {
        expect(await erc721Key.ownerOf(1)).to.equal(userA.address);
        expect(await erc721Key.ownerOf(2)).to.equal(userB.address);
    });

    it("ERC20 Test Token: User A owns 1, User B owns 1", async function () {
        expect(await erc20Token.balanceOf(userA.address)).to.equal(1)
        expect(await erc20Token.balanceOf(userB.address)).to.equal(1)
    });

    it("ERC721 Test Token: User A owns #1, User B owns #2", async function () {
        expect(await erc721Token.ownerOf(1)).to.equal(userA.address);
        expect(await erc721Token.ownerOf(2)).to.equal(userB.address);
    });

    it("ERC1155 Test Token: User A owns 1 of #1, User B owns 1 of #2", async function () {
        expect(await erc1155Token.balanceOf(userA.address, 1)).to.equal(1)
        expect(await erc1155Token.balanceOf(userB.address, 2)).to.equal(1)
    });

    it("CryptoPunks: User A owns #1, User B owns #2", async function () {
        expect(await cryptoPunksToken.punkIndexToAddress(1)).to.equal(userA.address)
        expect(await cryptoPunksToken.punkIndexToAddress(2)).to.equal(userB.address)
    });

});
