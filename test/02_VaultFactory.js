const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

const { deployContracts } = require("./shared/utilities")

var vaultTeam, tokenTeam, userA, userB, userC, erc721Key, erc20Token, erc721Token, erc1155Token, cryptoPunksToken, vaultFactory, vaultImplementation, vaultFactoryImplementation;

describe("Vault Factory", function () {

  describe("Initialization", function () {

    beforeEach("Deploy Factory & Tokens", async () => {
      ({ vaultTeam, tokenTeam, userA, userB, userC, erc721Key, erc20Token, erc721Token, erc1155Token, cryptoPunksToken, vaultFactory, vaultImplementation, vaultFactoryImplementation } = await loadFixture(deployContracts));
    })

    it("Initialize cannot be called on vault factory proxy contract", async function () {
      await expect(vaultFactory.connect(userA).initialize("0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000")).to.be.revertedWith("Initializable: contract is already initialized");
    });

    it("Initialize cannot be called on vault factory implementation contract", async function () {
      await expect(vaultFactoryImplementation.connect(userA).initialize("0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000")).to.be.revertedWith("Initializable: contract is already initialized");
    });

    it("User cannot create vault using vault factory implementation contract", async function () {
      await expect(vaultFactoryImplementation.connect(userA).createVault(1)).to.be.reverted;
    });

  });

  describe("Vault Creation", function () {

    beforeEach("Deploy Factory & Tokens", async () => {
      ({ vaultTeam, tokenTeam, userA, userB, userC, erc721Key, erc20Token, erc721Token, erc1155Token, cryptoPunksToken, vaultFactory, vaultImplementation, vaultFactoryImplementation } = await loadFixture(deployContracts));
    })

    it("Creating vault emits an event", async function () {
      await expect(vaultFactory.connect(userA).createVault(1)).to.emit(vaultFactory, 'CreateVault').withArgs(1, anyValue);
    });

    it("User can create vault for owned key token", async function () {
      await expect(vaultFactory.connect(userA).createVault(1)).not.to.be.reverted;
      expect(await vaultFactory.vaultOf(1)).not.to.equal("0x0000000000000000000000000000000000000000");
    });

    it("User cannot create vault for unowned key token (user owns a different key token)", async function () {
      await expect(vaultFactory.connect(userA).createVault(2)).to.be.revertedWith("Caller does not own the provided vault key.");
      expect(await vaultFactory.vaultOf(2)).to.equal("0x0000000000000000000000000000000000000000");
    });

    it("User cannot create vault for unowned key token (user does not own any key token)", async function () {
      await expect(vaultFactory.connect(userB).createVault(1)).to.be.revertedWith("Caller does not own the provided vault key.");
      expect(await vaultFactory.vaultOf(1)).to.equal("0x0000000000000000000000000000000000000000");
    });

    it("Same vault cannot be created twice (same user for both transactions)", async function () {
      await expect(vaultFactory.connect(userA).createVault(1)).not.to.be.reverted;
      expect(await vaultFactory.vaultOf(1)).not.to.equal("0x0000000000000000000000000000000000000000");
      await expect(vaultFactory.connect(userA).createVault(1)).to.be.revertedWith("Vault key is already associated with a vault.");
      expect(await vaultFactory.vaultOf(1)).not.to.equal("0x0000000000000000000000000000000000000000");
    });

    it("Same vault cannot be created twice (different user for each transaction)", async function () {
      await expect(vaultFactory.connect(userA).createVault(1)).not.to.be.reverted;
      expect(await vaultFactory.vaultOf(1)).not.to.equal("0x0000000000000000000000000000000000000000");
      await erc721Key.connect(userA)["safeTransferFrom(address,address,uint256)"](userA.address, userB.address, 1);
      await expect(vaultFactory.connect(userB).createVault(1)).to.be.revertedWith("Vault key is already associated with a vault.");
      expect(await vaultFactory.vaultOf(1)).not.to.equal("0x0000000000000000000000000000000000000000");
    });

    it("Vault factory correctly stores vault addresses", async function () {
      const createVaultTopic = vaultFactory.interface.getEventTopic('CreateVault');


      var transaction1 = await vaultFactory.connect(userA).createVault(1);
      const receipt1 = await transaction1.wait();
      const log1 = receipt1.logs.find(x => x.topics.indexOf(createVaultTopic) >= 0);
      const event1 = vaultFactory.interface.parseLog(log1);
      const vault1Address = event1.args.vaultAddress

      var transaction2 = await vaultFactory.connect(userB).createVault(2);
      const receipt2 = await transaction2.wait();
      const log2 = receipt2.logs.find(x => x.topics.indexOf(createVaultTopic) >= 0);
      const event2 = vaultFactory.interface.parseLog(log2);
      const vault2Address = event2.args.vaultAddress


      expect(await vaultFactory.vaultOf(1)).to.equal(vault1Address)
      expect(await vaultFactory.vaultOf(2)).to.equal(vault2Address)
      
    });

  });



});