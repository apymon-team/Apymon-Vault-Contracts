const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

const { deployContracts, TokenType } = require("./shared/utilities")

var vaultTeam, tokenTeam, userA, userB, userC, erc721Key, erc20Token, erc721Token, erc1155Token, cryptoPunksToken, vaultFactory;

const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;

//
//  Vault
//

describe("Vault", function () {

  let vaultProxy;

  //
  //  Initialization
  //

  describe("Initialization", function () {
    beforeEach("Deploy Factory & Tokens & Create a vault", async () => {
      ({ vaultTeam, tokenTeam, userA, userB, userC, erc721Key, erc20Token, erc721Token, erc1155Token, cryptoPunksToken, vaultFactory, vaultImplementation } = await loadFixture(deployContracts));

      await vaultFactory.connect(userA).createVault(1);

      let vaultAddress = await vaultFactory.vaultOf(1);

      const VaultProxy = await ethers.getContractFactory("Vault");
      vaultProxy = VaultProxy.attach(vaultAddress);
    });

    it("Initialize cannot be called on the implementation contract.", async function () {
      await expect(vaultImplementation.connect(userA).initialize(erc721Key.address, 1)).to.be.reverted;
    });

    it("Initialize cannot be called on the proxy contract.", async function () {
      await expect(vaultProxy.connect(userB).initialize(erc721Key.address, 2)).to.be.reverted;
    });

  });

  //
  //  Deposits
  //

  describe("Deposits", function () {

    beforeEach("Deploy Factory & Tokens & Create a vault", async () => {
      ({ vaultTeam, tokenTeam, userA, userB, userC, erc721Key, erc20Token, erc721Token, erc1155Token, cryptoPunksToken, vaultFactory } = await loadFixture(deployContracts));

      await vaultFactory.connect(userA).createVault(1);

      let vaultAddress = await vaultFactory.vaultOf(1);

      const VaultProxy = await ethers.getContractFactory("Vault");
      vaultProxy = VaultProxy.attach(vaultAddress);
    })

    it("Key token cannot be deposited via safeTransferFrom to the vault it controls", async function () {
      expect(await erc721Key.ownerOf(1)).to.equal(userA.address)
      await expect(erc721Key.connect(userA)["safeTransferFrom(address,address,uint256)"](userA.address, vaultProxy.address, 1)).to.be.reverted;
      expect(await erc721Key.ownerOf(1)).not.to.equal(vaultProxy.address)
    });

    it("Key token can be deposited via safeTransferFrom to a vault it does not control", async function () {
      expect(await erc721Key.ownerOf(2)).to.equal(userB.address)
      await expect(erc721Key.connect(userB)["safeTransferFrom(address,address,uint256)"](userB.address, vaultProxy.address, 2)).not.to.be.reverted;
      expect(await erc721Key.ownerOf(2)).to.equal(vaultProxy.address)
    });

    // Owner

    it("Owner can deposit ETH", async function () {
      expect(
        await userA.sendTransaction({ to: vaultProxy.address, value: ethers.utils.parseEther('1', 'ether') })
      ).to.changeEtherBalances(
        [userA, vaultProxy],
        [ethers.utils.parseEther('-1', 'ether'), ethers.utils.parseEther('1', 'ether')]
      );
    });

    it("Owner can deposit ERC20", async function () {
      expect(await erc20Token.balanceOf(userA.address)).to.equal(1)
      expect(await erc20Token.balanceOf(vaultProxy.address)).to.equal(0)
      await expect(erc20Token.connect(userA).transfer(vaultProxy.address, 1)).not.to.be.reverted;
      expect(await erc20Token.balanceOf(userA.address)).to.equal(0)
      expect(await erc20Token.balanceOf(vaultProxy.address)).to.equal(1)

    });

    it("Owner can deposit ERC721", async function () {
      expect(await erc721Token.ownerOf(1)).to.equal(userA.address)
      await expect(erc721Token.connect(userA)["safeTransferFrom(address,address,uint256)"](userA.address, vaultProxy.address, 1)).not.to.be.reverted;
      expect(await erc721Token.ownerOf(1)).to.equal(vaultProxy.address)

    });

    it("Owner can deposit ERC1155", async function () {
      expect(await erc1155Token.balanceOf(userA.address, 1)).to.equal(1)
      expect(await erc1155Token.balanceOf(vaultProxy.address, 1)).to.equal(0)
      await expect(erc1155Token.connect(userA)["safeTransferFrom(address,address,uint256,uint256,bytes)"](userA.address, vaultProxy.address, 1, 1, [])).not.to.be.reverted;
      expect(await erc1155Token.balanceOf(userA.address, 1)).to.equal(0)
      expect(await erc1155Token.balanceOf(vaultProxy.address, 1)).to.equal(1)

    });


    it("Owner can deposit CryptoPunk", async function () {
      expect(await cryptoPunksToken.punkIndexToAddress(1)).to.equal(userA.address)
      await expect(cryptoPunksToken.connect(userA).transferPunk(vaultProxy.address, 1)).not.to.be.reverted;
      expect(await cryptoPunksToken.punkIndexToAddress(1)).to.equal(vaultProxy.address)
    });

    // Nonowner

    it("Nonowner can deposit ETH", async function () {
      expect(
        await userB.sendTransaction({ to: vaultProxy.address, value: ethers.utils.parseEther('1', 'ether') })
      ).to.changeEtherBalances(
        [userB, vaultProxy],
        [ethers.utils.parseEther('-1', 'ether'), ethers.utils.parseEther('1', 'ether')]
      );
    });

    it("Nonowner can deposit ERC20", async function () {
      expect(await erc20Token.balanceOf(userB.address)).to.equal(1)
      expect(await erc20Token.balanceOf(vaultProxy.address)).to.equal(0)
      await expect(erc20Token.connect(userB).transfer(vaultProxy.address, 1)).not.to.be.reverted;
      expect(await erc20Token.balanceOf(userB.address)).to.equal(0)
      expect(await erc20Token.balanceOf(vaultProxy.address)).to.equal(1)
    });

    it("Nonowner can deposit ERC721", async function () {
      expect(await erc721Token.ownerOf(2)).to.equal(userB.address)
      await expect(erc721Token.connect(userB)["safeTransferFrom(address,address,uint256)"](userB.address, vaultProxy.address, 2)).not.to.be.reverted;
      expect(await erc721Token.ownerOf(2)).to.equal(vaultProxy.address)
    });

    it("Nonowner can deposit ERC1155", async function () {
      expect(await erc1155Token.balanceOf(userB.address, 2)).to.equal(1)
      expect(await erc1155Token.balanceOf(vaultProxy.address, 2)).to.equal(0)
      await expect(erc1155Token.connect(userB)["safeTransferFrom(address,address,uint256,uint256,bytes)"](userB.address, vaultProxy.address, 2, 1, [])).not.to.be.reverted;
      expect(await erc1155Token.balanceOf(userB.address, 2)).to.equal(0)
      expect(await erc1155Token.balanceOf(vaultProxy.address, 2)).to.equal(1)
    });

    it("Nonowner can deposit CryptoPunk", async function () {
      expect(await cryptoPunksToken.punkIndexToAddress(2)).to.equal(userB.address)
      await expect(cryptoPunksToken.connect(userB).transferPunk(vaultProxy.address, 2)).not.to.be.reverted;
      expect(await cryptoPunksToken.punkIndexToAddress(2)).to.equal(vaultProxy.address)
    });


  });

  //
  //  Withdraws
  //

  describe("Withdraws", function () {

    beforeEach("Deploy Factory & Tokens & Create a vault & Deposit", async () => {
      ({ vaultTeam, tokenTeam, userA, userB, userC, erc721Key, erc20Token, erc721Token, erc1155Token, cryptoPunksToken, vaultFactory } = await loadFixture(deployContracts));

      await vaultFactory.connect(userA).createVault(1);

      let vaultAddress = await vaultFactory.vaultOf(1);

      const VaultProxy = await ethers.getContractFactory("Vault");
      vaultProxy = VaultProxy.attach(vaultAddress);


      //Deposits
      await userA.sendTransaction({ to: vaultProxy.address, value: ethers.utils.parseEther('1', 'ether') })
      await erc20Token.connect(userA).transfer(vaultProxy.address, 1);
      await erc721Token.connect(userA)["safeTransferFrom(address,address,uint256)"](userA.address, vaultProxy.address, 1);
      await erc1155Token.connect(userA)["safeTransferFrom(address,address,uint256,uint256,bytes)"](userA.address, vaultProxy.address, 1, 1, [])
      await cryptoPunksToken.connect(userA).transferPunk(vaultProxy.address, 1);

    })

    it("Withdrawing ETH emits an event", async function () {
      var amount = ethers.utils.parseEther('1', 'ether').toString();
      await expect(vaultProxy.connect(userA).withdrawETH(userB.address, amount)).to.emit(vaultProxy, 'WithdrawETH').withArgs(userA.address, userB.address, amount);
    });

    it("Withdrawing ERC20 emits an event", async function () {
      await expect(vaultProxy.connect(userA).withdrawERC20(erc20Token.address, userB.address, 1)).to.emit(vaultProxy, 'WithdrawERC20').withArgs(userA.address, erc20Token.address, userB.address, 1);
    });

    it("Withdrawing ERC721 emits an event", async function () {
      await expect(vaultProxy.connect(userA).withdrawERC721(erc721Token.address, 1, userB.address)).to.emit(vaultProxy, 'WithdrawERC721').withArgs(userA.address, erc721Token.address, 1, userB.address);
    });

    it("Withdrawing ERC1155 emits an event", async function () {
      await expect(vaultProxy.connect(userA).withdrawERC1155(erc1155Token.address, 1, userB.address, 1)).to.emit(vaultProxy, 'WithdrawERC1155').withArgs(userA.address, erc1155Token.address, 1, userB.address, 1);
    });

    it("Withdrawing CryptoPunk emits an event", async function () {
      await expect(vaultProxy.connect(userA).withdrawCryptoPunk(cryptoPunksToken.address, 1, userB.address)).to.emit(vaultProxy, 'WithdrawCryptoPunk').withArgs(userA.address, cryptoPunksToken.address, 1, userB.address);
    });

    it("Owner can withdraw ETH to self", async function () {
      expect(
        await vaultProxy.connect(userA).withdrawETH(userA.address, ethers.utils.parseEther('1', 'ether').toString())
      ).to.changeEtherBalances(
        [vaultProxy, userA],
        [ethers.utils.parseEther('-1', 'ether'), ethers.utils.parseEther('1', 'ether')]
      );

    });

    it("Owner can withdraw ETH to someone else", async function () {
      expect(
        await vaultProxy.connect(userA).withdrawETH(userB.address, ethers.utils.parseEther('1', 'ether').toString())
      ).to.changeEtherBalances(
        [vaultProxy, userB],
        [ethers.utils.parseEther('-1', 'ether'), ethers.utils.parseEther('1', 'ether')]
      );

    });

    it("Owner can withdraw ERC20 to self", async function () {
      expect(await erc20Token.balanceOf(userA.address)).to.equal(0)
      expect(await erc20Token.balanceOf(vaultProxy.address)).to.equal(1)

      await expect(vaultProxy.connect(userA).withdrawERC20(erc20Token.address, userA.address, 1)).not.to.be.reverted

      expect(await erc20Token.balanceOf(userA.address)).to.equal(1)
      expect(await erc20Token.balanceOf(vaultProxy.address)).to.equal(0)

    });

    it("Owner can withdraw ERC20 to someone else", async function () {
      expect(await erc20Token.balanceOf(userA.address)).to.equal(0)
      expect(await erc20Token.balanceOf(userB.address)).to.equal(1)
      expect(await erc20Token.balanceOf(vaultProxy.address)).to.equal(1)

      await expect(vaultProxy.connect(userA).withdrawERC20(erc20Token.address, userB.address, 1)).not.to.be.reverted

      expect(await erc20Token.balanceOf(userA.address)).to.equal(0)
      expect(await erc20Token.balanceOf(userB.address)).to.equal(2)
      expect(await erc20Token.balanceOf(vaultProxy.address)).to.equal(0)

    });

    it("Owner can withdraw ERC721 to self", async function () {
      expect(await erc721Token.ownerOf(1)).to.equal(vaultProxy.address)
      await expect(vaultProxy.connect(userA).withdrawERC721(erc721Token.address, 1, userA.address)).not.to.be.reverted
      expect(await erc721Token.ownerOf(1)).to.equal(userA.address)
    });

    it("Owner can withdraw ERC721 to someone else", async function () {
      expect(await erc721Token.ownerOf(1)).to.equal(vaultProxy.address)
      await expect(vaultProxy.connect(userA).withdrawERC721(erc721Token.address, 1, userB.address)).not.to.be.reverted
      expect(await erc721Token.ownerOf(1)).to.equal(userB.address)
    });

    it("Owner can withdraw ERC1155 to self", async function () {
      expect(await erc1155Token.balanceOf(userA.address, 1)).to.equal(0)
      expect(await erc1155Token.balanceOf(vaultProxy.address, 1)).to.equal(1)

      await expect(vaultProxy.connect(userA).withdrawERC1155(erc1155Token.address, 1, userA.address, 1)).not.to.be.reverted

      expect(await erc1155Token.balanceOf(userA.address, 1)).to.equal(1)
      expect(await erc1155Token.balanceOf(vaultProxy.address, 1)).to.equal(0)

    });

    it("Owner can withdraw ERC1155 to someone else", async function () {
      expect(await erc1155Token.balanceOf(userA.address, 1)).to.equal(0)
      expect(await erc1155Token.balanceOf(userB.address, 1)).to.equal(0)
      expect(await erc1155Token.balanceOf(vaultProxy.address, 1)).to.equal(1)

      await expect(vaultProxy.connect(userA).withdrawERC1155(erc1155Token.address, 1, userB.address, 1)).not.to.be.reverted

      expect(await erc1155Token.balanceOf(userA.address, 1)).to.equal(0)
      expect(await erc1155Token.balanceOf(userB.address, 1)).to.equal(1)
      expect(await erc1155Token.balanceOf(vaultProxy.address, 1)).to.equal(0)

    });

    it("Owner can withdraw CryptoPunk to self", async function () {
      expect(await cryptoPunksToken.punkIndexToAddress(1)).to.equal(vaultProxy.address)
      await expect(vaultProxy.connect(userA).withdrawCryptoPunk(cryptoPunksToken.address, 1, userA.address)).not.to.be.reverted
      expect(await cryptoPunksToken.punkIndexToAddress(1)).to.equal(userA.address)
    });

    it("Owner can withdraw CryptoPunk to someone else", async function () {
      expect(await cryptoPunksToken.punkIndexToAddress(1)).to.equal(vaultProxy.address)
      await expect(vaultProxy.connect(userA).withdrawCryptoPunk(cryptoPunksToken.address, 1, userB.address)).not.to.be.reverted
      expect(await cryptoPunksToken.punkIndexToAddress(1)).to.equal(userB.address)
    });

    it("Owner can withdraw multiple tokens to self", async function () {

      expect(await erc20Token.balanceOf(userA.address)).to.equal(0)
      expect(await erc20Token.balanceOf(vaultProxy.address)).to.equal(1)

      expect(await erc721Token.ownerOf(1)).to.equal(vaultProxy.address)

      expect(await erc1155Token.balanceOf(userA.address, 1)).to.equal(0)
      expect(await erc1155Token.balanceOf(userB.address, 1)).to.equal(0)
      expect(await erc1155Token.balanceOf(vaultProxy.address, 1)).to.equal(1)

      expect(await cryptoPunksToken.punkIndexToAddress(1)).to.equal(vaultProxy.address)


      let ethWithdraw = { tokenType: TokenType.ETH, token: "0x0000000000000000000000000000000000000000", tokenId: 0, amount: ethers.utils.parseEther('1', 'ether') }
      let erc20Withdraw = { tokenType: TokenType.ERC20, token: erc20Token.address, tokenId: 0, amount: 1 }
      let erc721Withdraw = { tokenType: TokenType.ERC721, token: erc721Token.address, tokenId: 1, amount: 0 }
      let erc1155Withdraw = { tokenType: TokenType.ERC1155, token: erc1155Token.address, tokenId: 1, amount: 1 }
      let cryptopunkWithdraw = { tokenType: TokenType.CryptoPunk, token: cryptoPunksToken.address, tokenId: 1, amount: 0 }

      expect(
        await vaultProxy.connect(userA).withdrawMultiple([ethWithdraw, erc20Withdraw, erc721Withdraw, erc1155Withdraw, cryptopunkWithdraw], userA.address)
      ).to.changeEtherBalances(
        [vaultProxy, userA],
        [ethers.utils.parseEther('-1', 'ether'), ethers.utils.parseEther('1', 'ether')]
      );


      expect(await erc20Token.balanceOf(userA.address)).to.equal(1)
      expect(await erc20Token.balanceOf(vaultProxy.address)).to.equal(0)

      expect(await erc721Token.ownerOf(1)).to.equal(userA.address)

      expect(await erc1155Token.balanceOf(userA.address, 1)).to.equal(1)
      expect(await erc1155Token.balanceOf(userB.address, 1)).to.equal(0)
      expect(await erc1155Token.balanceOf(vaultProxy.address, 1)).to.equal(0)

      expect(await cryptoPunksToken.punkIndexToAddress(1)).to.equal(userA.address)

    });


    it("Owner can withdraw multiple tokens to someone else", async function () {

      expect(await erc20Token.balanceOf(userA.address)).to.equal(0)
      expect(await erc20Token.balanceOf(userB.address)).to.equal(1)
      expect(await erc20Token.balanceOf(vaultProxy.address)).to.equal(1)

      expect(await erc721Token.ownerOf(1)).to.equal(vaultProxy.address)

      expect(await erc1155Token.balanceOf(userA.address, 1)).to.equal(0)
      expect(await erc1155Token.balanceOf(userB.address, 1)).to.equal(0)
      expect(await erc1155Token.balanceOf(vaultProxy.address, 1)).to.equal(1)

      expect(await cryptoPunksToken.punkIndexToAddress(1)).to.equal(vaultProxy.address)

      let ethWithdraw = { tokenType: TokenType.ETH, token: "0x0000000000000000000000000000000000000000", tokenId: 0, amount: ethers.utils.parseEther('1', 'ether') }
      let erc20Withdraw = { tokenType: TokenType.ERC20, token: erc20Token.address, tokenId: 0, amount: 1 }
      let erc721Withdraw = { tokenType: TokenType.ERC721, token: erc721Token.address, tokenId: 1, amount: 0 }
      let erc1155Withdraw = { tokenType: TokenType.ERC1155, token: erc1155Token.address, tokenId: 1, amount: 1 }
      let cryptopunkWithdraw = { tokenType: TokenType.CryptoPunk, token: cryptoPunksToken.address, tokenId: 1, amount: 0 }

      expect(
        await vaultProxy.connect(userA).withdrawMultiple([ethWithdraw, erc20Withdraw, erc721Withdraw, erc1155Withdraw, cryptopunkWithdraw], userB.address)
      ).to.changeEtherBalances(
        [vaultProxy, userB],
        [ethers.utils.parseEther('-1', 'ether'), ethers.utils.parseEther('1', 'ether')]
      );


      expect(await erc20Token.balanceOf(userA.address)).to.equal(0)
      expect(await erc20Token.balanceOf(userB.address)).to.equal(2)
      expect(await erc20Token.balanceOf(vaultProxy.address)).to.equal(0)

      expect(await erc721Token.ownerOf(1)).to.equal(userB.address)

      expect(await erc1155Token.balanceOf(userA.address, 1)).to.equal(0)
      expect(await erc1155Token.balanceOf(userB.address, 1)).to.equal(1)
      expect(await erc1155Token.balanceOf(vaultProxy.address, 1)).to.equal(0)

      expect(await cryptoPunksToken.punkIndexToAddress(1)).to.equal(userB.address)

    });

    it("Nonowner cannot withdraw ETH to self", async function () {
      await expect(
        vaultProxy.connect(userB).withdrawETH(userB.address, ethers.utils.parseEther('1', 'ether').toString())
      ).to.be.reverted;
    });

    it("Nonowner cannot withdraw ETH to someone else", async function () {
      await expect(
        vaultProxy.connect(userB).withdrawETH(userA.address, ethers.utils.parseEther('1', 'ether').toString())
      ).to.be.reverted;
    });

    it("Nonowner cannot withdraw ERC20 to self", async function () {
      expect(await erc20Token.balanceOf(userA.address)).to.equal(0)
      expect(await erc20Token.balanceOf(userB.address)).to.equal(1)
      expect(await erc20Token.balanceOf(vaultProxy.address)).to.equal(1)

      await expect(vaultProxy.connect(userB).withdrawERC20(erc20Token.address, userB.address, 1)).to.be.reverted

      expect(await erc20Token.balanceOf(userA.address)).to.equal(0)
      expect(await erc20Token.balanceOf(userB.address)).to.equal(1)
      expect(await erc20Token.balanceOf(vaultProxy.address)).to.equal(1)

    });

    it("Nonowner cannot withdraw ERC20 to someone else", async function () {
      expect(await erc20Token.balanceOf(userA.address)).to.equal(0)
      expect(await erc20Token.balanceOf(userB.address)).to.equal(1)
      expect(await erc20Token.balanceOf(vaultProxy.address)).to.equal(1)

      await expect(vaultProxy.connect(userB).withdrawERC20(erc20Token.address, userA.address, 1)).to.be.reverted

      expect(await erc20Token.balanceOf(userA.address)).to.equal(0)
      expect(await erc20Token.balanceOf(userB.address)).to.equal(1)
      expect(await erc20Token.balanceOf(vaultProxy.address)).to.equal(1)

    });

    it("Nonowner cannot withdraw ERC721 to self", async function () {
      expect(await erc721Token.ownerOf(1)).to.equal(vaultProxy.address)
      await expect(vaultProxy.connect(userB).withdrawERC721(erc721Token.address, 1, userB.address)).to.be.reverted
      expect(await erc721Token.ownerOf(1)).to.equal(vaultProxy.address)
    });

    it("Nonowner cannot withdraw ERC721 to someone else", async function () {
      expect(await erc721Token.ownerOf(1)).to.equal(vaultProxy.address)
      await expect(vaultProxy.connect(userB).withdrawERC721(erc721Token.address, 1, userA.address)).to.be.reverted
      expect(await erc721Token.ownerOf(1)).to.equal(vaultProxy.address)
    });

    it("Nonowner cannot withdraw ERC1155 to self", async function () {
      expect(await erc1155Token.balanceOf(userA.address, 1)).to.equal(0)
      expect(await erc1155Token.balanceOf(userB.address, 1)).to.equal(0)
      expect(await erc1155Token.balanceOf(vaultProxy.address, 1)).to.equal(1)

      await expect(vaultProxy.connect(userB).withdrawERC1155(erc1155Token.address, 1, userB.address, 1)).to.be.reverted

      expect(await erc1155Token.balanceOf(userA.address, 1)).to.equal(0)
      expect(await erc1155Token.balanceOf(userB.address, 1)).to.equal(0)
      expect(await erc1155Token.balanceOf(vaultProxy.address, 1)).to.equal(1)

    });

    it("Nonowner cannot withdraw ERC1155 to someone else", async function () {
      expect(await erc1155Token.balanceOf(userA.address, 1)).to.equal(0)
      expect(await erc1155Token.balanceOf(userB.address, 1)).to.equal(0)
      expect(await erc1155Token.balanceOf(vaultProxy.address, 1)).to.equal(1)

      await expect(vaultProxy.connect(userB).withdrawERC1155(erc1155Token.address, 1, userA.address, 1)).to.be.reverted

      expect(await erc1155Token.balanceOf(userA.address, 1)).to.equal(0)
      expect(await erc1155Token.balanceOf(userB.address, 1)).to.equal(0)
      expect(await erc1155Token.balanceOf(vaultProxy.address, 1)).to.equal(1)

    });

    it("Nonowner cannot withdraw CryptoPunk to self", async function () {
      expect(await cryptoPunksToken.punkIndexToAddress(1)).to.equal(vaultProxy.address)
      await expect(vaultProxy.connect(userB).withdrawCryptoPunk(cryptoPunksToken.address, 1, userB.address)).to.be.reverted
      expect(await cryptoPunksToken.punkIndexToAddress(1)).to.equal(vaultProxy.address)
    });

    it("Nonowner cannot withdraw CryptoPunk to someone else", async function () {
      expect(await cryptoPunksToken.punkIndexToAddress(1)).to.equal(vaultProxy.address)
      await expect(vaultProxy.connect(userB).withdrawCryptoPunk(cryptoPunksToken.address, 1, userA.address)).to.be.reverted
      expect(await cryptoPunksToken.punkIndexToAddress(1)).to.equal(vaultProxy.address)
    });

    it("Nonowner cannot withdraw multiple tokens to self", async function () {

      expect(await erc20Token.balanceOf(userA.address)).to.equal(0)
      expect(await erc20Token.balanceOf(userB.address)).to.equal(1)
      expect(await erc20Token.balanceOf(vaultProxy.address)).to.equal(1)

      expect(await erc721Token.ownerOf(1)).to.equal(vaultProxy.address)

      expect(await erc1155Token.balanceOf(userA.address, 1)).to.equal(0)
      expect(await erc1155Token.balanceOf(userB.address, 1)).to.equal(0)
      expect(await erc1155Token.balanceOf(vaultProxy.address, 1)).to.equal(1)

      expect(await cryptoPunksToken.punkIndexToAddress(1)).to.equal(vaultProxy.address)

      let ethWithdraw = { tokenType: TokenType.ETH, token: "0x0000000000000000000000000000000000000000", tokenId: 0, amount: ethers.utils.parseEther('1', 'ether') }
      let erc20Withdraw = { tokenType: TokenType.ERC20, token: erc20Token.address, tokenId: 0, amount: 1 }
      let erc721Withdraw = { tokenType: TokenType.ERC721, token: erc721Token.address, tokenId: 1, amount: 0 }
      let erc1155Withdraw = { tokenType: TokenType.ERC1155, token: erc1155Token.address, tokenId: 1, amount: 1 }
      let cryptopunkWithdraw = { tokenType: TokenType.CryptoPunk, token: cryptoPunksToken.address, tokenId: 1, amount: 0 }

      await expect(vaultProxy.connect(userB).withdrawMultiple([ethWithdraw, erc20Withdraw, erc721Withdraw, erc1155Withdraw, cryptopunkWithdraw], userB.address)).to.be.reverted


      expect(await erc20Token.balanceOf(userA.address)).to.equal(0)
      expect(await erc20Token.balanceOf(userB.address)).to.equal(1)
      expect(await erc20Token.balanceOf(vaultProxy.address)).to.equal(1)

      expect(await erc721Token.ownerOf(1)).to.equal(vaultProxy.address)

      expect(await erc1155Token.balanceOf(userA.address, 1)).to.equal(0)
      expect(await erc1155Token.balanceOf(userB.address, 1)).to.equal(0)
      expect(await erc1155Token.balanceOf(vaultProxy.address, 1)).to.equal(1)

      expect(await cryptoPunksToken.punkIndexToAddress(1)).to.equal(vaultProxy.address)

    });

    it("Nonowner cannot withdraw multiple tokens to someone else", async function () {

      expect(await erc20Token.balanceOf(userA.address)).to.equal(0)
      expect(await erc20Token.balanceOf(userB.address)).to.equal(1)
      expect(await erc20Token.balanceOf(vaultProxy.address)).to.equal(1)

      expect(await erc721Token.ownerOf(1)).to.equal(vaultProxy.address)

      expect(await erc1155Token.balanceOf(userA.address, 1)).to.equal(0)
      expect(await erc1155Token.balanceOf(userB.address, 1)).to.equal(0)
      expect(await erc1155Token.balanceOf(vaultProxy.address, 1)).to.equal(1)

      expect(await cryptoPunksToken.punkIndexToAddress(1)).to.equal(vaultProxy.address)

      let ethWithdraw = { tokenType: TokenType.ETH, token: "0x0000000000000000000000000000000000000000", tokenId: 0, amount: ethers.utils.parseEther('1', 'ether') }
      let erc20Withdraw = { tokenType: TokenType.ERC20, token: erc20Token.address, tokenId: 0, amount: 1 }
      let erc721Withdraw = { tokenType: TokenType.ERC721, token: erc721Token.address, tokenId: 1, amount: 0 }
      let erc1155Withdraw = { tokenType: TokenType.ERC1155, token: erc1155Token.address, tokenId: 1, amount: 1 }
      let cryptopunkWithdraw = { tokenType: TokenType.CryptoPunk, token: cryptoPunksToken.address, tokenId: 1, amount: 0 }

      await expect(vaultProxy.connect(userB).withdrawMultiple([ethWithdraw, erc20Withdraw, erc721Withdraw, erc1155Withdraw, cryptopunkWithdraw], userA.address)).to.be.reverted

      expect(await erc20Token.balanceOf(userA.address)).to.equal(0)
      expect(await erc20Token.balanceOf(userB.address)).to.equal(1)
      expect(await erc20Token.balanceOf(vaultProxy.address)).to.equal(1)

      expect(await erc721Token.ownerOf(1)).to.equal(vaultProxy.address)

      expect(await erc1155Token.balanceOf(userA.address, 1)).to.equal(0)
      expect(await erc1155Token.balanceOf(userB.address, 1)).to.equal(0)
      expect(await erc1155Token.balanceOf(vaultProxy.address, 1)).to.equal(1)

      expect(await cryptoPunksToken.punkIndexToAddress(1)).to.equal(vaultProxy.address)

    });
  });


  //
  //  Timelock
  //

  describe("Timelock", function () {

    beforeEach("Deploy Factory & Tokens & Create a vault & Deposit", async () => {
      ({ vaultTeam, tokenTeam, userA, userB, userC, erc721Key, erc20Token, erc721Token, erc1155Token, cryptoPunksToken, vaultFactory } = await loadFixture(deployContracts));

      await vaultFactory.connect(userA).createVault(1);

      let vaultAddress = await vaultFactory.vaultOf(1);

      const VaultProxy = await ethers.getContractFactory("Vault");
      vaultProxy = VaultProxy.attach(vaultAddress);

      //Deposits
      await userA.sendTransaction({ to: vaultProxy.address, value: ethers.utils.parseEther('1', 'ether') })
      await erc20Token.connect(userA).transfer(vaultProxy.address, 1);
      await erc721Token.connect(userA)["safeTransferFrom(address,address,uint256)"](userA.address, vaultProxy.address, 1);
      await erc1155Token.connect(userA)["safeTransferFrom(address,address,uint256,uint256,bytes)"](userA.address, vaultProxy.address, 1, 1, [])
      await cryptoPunksToken.connect(userA).transferPunk(vaultProxy.address, 1);

    })

    it("Timelocking vault emits an event", async function () {
      const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;
      const unlockNote = "This is a very important message from the past."
      await expect(vaultProxy.connect(userA).timelock(unlockTime, unlockNote)).to.emit(vaultProxy, 'LockVault').withArgs(unlockTime, unlockNote);
    });

    it("Unlock time starts at zero", async function () {
      expect(await vaultProxy.unlockTime()).to.equal(0);
    });

    it("Owner can timelock vault", async function () {
      const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;
      const unlockNote = "This is a very important message from the past."
      await expect(vaultProxy.connect(userA).timelock(unlockTime, unlockNote)).not.to.be.reverted
      expect(await vaultProxy.unlockTime()).to.equal(unlockTime);
    });

    it("Nonowner cannot timelock vault", async function () {
      const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;
      const unlockNote = "This is a very important message from the past."
      await expect(vaultProxy.connect(userB).timelock(unlockTime, unlockNote)).to.be.reverted
      expect(await vaultProxy.unlockTime()).to.equal(0);
    });

    describe("Locked", function () {

      let unlockTime;
      const unlockNote = "This is a very important message from the past."

      beforeEach("Deploy Factory & Tokens & Create a vault & Deposit", async () => {
        ({ vaultTeam, tokenTeam, userA, userB, userC, erc721Key, erc20Token, erc721Token, erc1155Token, cryptoPunksToken, vaultFactory } = await loadFixture(deployContracts));

        await vaultFactory.connect(userA).createVault(1);

        let vaultAddress = await vaultFactory.vaultOf(1);

        const VaultProxy = await ethers.getContractFactory("Vault");
        vaultProxy = VaultProxy.attach(vaultAddress);

        //Deposits
        await userA.sendTransaction({ to: vaultProxy.address, value: ethers.utils.parseEther('1', 'ether') })
        await erc20Token.connect(userA).transfer(vaultProxy.address, 1);
        await erc721Token.connect(userA)["safeTransferFrom(address,address,uint256)"](userA.address, vaultProxy.address, 1);
        await erc1155Token.connect(userA)["safeTransferFrom(address,address,uint256,uint256,bytes)"](userA.address, vaultProxy.address, 1, 1, [])
        await cryptoPunksToken.connect(userA).transferPunk(vaultProxy.address, 1);

        //Timelock
        unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;
        await vaultProxy.connect(userA).timelock(unlockTime, unlockNote);

      })

      it("Owner cannot change timelock", async function () {

        expect(await vaultProxy.unlockTime()).to.not.equal(0);
        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);
        await expect(vaultProxy.connect(userA).timelock(unlockTime, unlockNote)).to.be.reverted
        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);

      });

      it("Owner cannot withdraw ETH", async function () {

        expect(await vaultProxy.unlockTime()).to.not.equal(0);
        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);
        await expect(vaultProxy.connect(userA).withdrawETH(userA.address, ethers.utils.parseEther('1', 'ether').toString())).to.be.reverted;
        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);

      });

      it("Owner cannot withdraw ERC20", async function () {

        expect(await vaultProxy.unlockTime()).to.not.equal(0);
        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);

        expect(await erc20Token.balanceOf(userA.address)).to.equal(0)
        expect(await erc20Token.balanceOf(vaultProxy.address)).to.equal(1)

        await expect(vaultProxy.connect(userA).withdrawERC20(erc20Token.address, userA.address, 1)).to.be.reverted

        expect(await erc20Token.balanceOf(userA.address)).to.equal(0)
        expect(await erc20Token.balanceOf(vaultProxy.address)).to.equal(1)

        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);
      });

      it("Owner cannot withdraw ERC721", async function () {
        expect(await vaultProxy.unlockTime()).to.not.equal(0);
        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);

        expect(await erc721Token.ownerOf(1)).to.equal(vaultProxy.address)
        await expect(vaultProxy.connect(userA).withdrawERC721(erc721Token.address, 1, userA.address)).to.be.reverted
        expect(await erc721Token.ownerOf(1)).to.equal(vaultProxy.address)

        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);

      });

      it("Owner cannot withdraw ERC1155", async function () {
        expect(await vaultProxy.unlockTime()).to.not.equal(0);
        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);

        expect(await erc1155Token.balanceOf(userA.address, 1)).to.equal(0)
        expect(await erc1155Token.balanceOf(vaultProxy.address, 1)).to.equal(1)

        await expect(vaultProxy.connect(userA).withdrawERC1155(erc1155Token.address, 1, userA.address, 1)).to.be.reverted

        expect(await erc1155Token.balanceOf(userA.address, 1)).to.equal(0)
        expect(await erc1155Token.balanceOf(vaultProxy.address, 1)).to.equal(1)

        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);

      });

      it("Owner cannot withdraw CryptoPunk", async function () {
        expect(await vaultProxy.unlockTime()).to.not.equal(0);
        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);

        expect(await cryptoPunksToken.punkIndexToAddress(1)).to.equal(vaultProxy.address)
        await expect(vaultProxy.connect(userA).withdrawCryptoPunk(cryptoPunksToken.address, 1, userA.address)).to.be.reverted
        expect(await cryptoPunksToken.punkIndexToAddress(1)).to.equal(vaultProxy.address)

        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);

      });

      it("Owner cannot withdraw multiple tokens", async function () {
        expect(await vaultProxy.unlockTime()).to.not.equal(0);
        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);

        expect(await erc20Token.balanceOf(userA.address)).to.equal(0)
        expect(await erc20Token.balanceOf(vaultProxy.address)).to.equal(1)
        expect(await erc721Token.ownerOf(1)).to.equal(vaultProxy.address)
        expect(await erc1155Token.balanceOf(userA.address, 1)).to.equal(0)
        expect(await erc1155Token.balanceOf(userB.address, 1)).to.equal(0)
        expect(await erc1155Token.balanceOf(vaultProxy.address, 1)).to.equal(1)
        expect(await cryptoPunksToken.punkIndexToAddress(1)).to.equal(vaultProxy.address)

        let ethWithdraw = { tokenType: TokenType.ETH, token: "0x0000000000000000000000000000000000000000", tokenId: 0, amount: ethers.utils.parseEther('1', 'ether') }
        let erc20Withdraw = { tokenType: TokenType.ERC20, token: erc20Token.address, tokenId: 0, amount: 1 }
        let erc721Withdraw = { tokenType: TokenType.ERC721, token: erc721Token.address, tokenId: 1, amount: 0 }
        let erc1155Withdraw = { tokenType: TokenType.ERC1155, token: erc1155Token.address, tokenId: 1, amount: 1 }
        let cryptopunkWithdraw = { tokenType: TokenType.CryptoPunk, token: cryptoPunksToken.address, tokenId: 1, amount: 0 }

        await expect(vaultProxy.connect(userA).withdrawMultiple([ethWithdraw, erc20Withdraw, erc721Withdraw, erc1155Withdraw, cryptopunkWithdraw], userA.address)).to.be.reverted

        expect(await erc20Token.balanceOf(userA.address)).to.equal(0)
        expect(await erc20Token.balanceOf(vaultProxy.address)).to.equal(1)
        expect(await erc721Token.ownerOf(1)).to.equal(vaultProxy.address)
        expect(await erc1155Token.balanceOf(userA.address, 1)).to.equal(0)
        expect(await erc1155Token.balanceOf(userB.address, 1)).to.equal(0)
        expect(await erc1155Token.balanceOf(vaultProxy.address, 1)).to.equal(1)
        expect(await cryptoPunksToken.punkIndexToAddress(1)).to.equal(vaultProxy.address)

        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);

      });

      it("Nonowner cannot withdraw ETH", async function () {
        expect(await vaultProxy.unlockTime()).to.not.equal(0);
        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);

        await expect(vaultProxy.connect(userB).withdrawETH(userB.address, ethers.utils.parseEther('1', 'ether').toString())).to.be.reverted;

        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);

      });

      it("Nonowner cannot withdraw ERC20", async function () {
        expect(await vaultProxy.unlockTime()).to.not.equal(0);
        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);

        expect(await erc20Token.balanceOf(userB.address)).to.equal(1)
        expect(await erc20Token.balanceOf(vaultProxy.address)).to.equal(1)

        await expect(vaultProxy.connect(userB).withdrawERC20(erc20Token.address, userB.address, 1)).to.be.reverted

        expect(await erc20Token.balanceOf(userB.address)).to.equal(1)
        expect(await erc20Token.balanceOf(vaultProxy.address)).to.equal(1)

        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);
      });

      it("Nonowner cannot withdraw ERC721", async function () {
        expect(await vaultProxy.unlockTime()).to.not.equal(0);
        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);

        expect(await erc721Token.ownerOf(1)).to.equal(vaultProxy.address)
        await expect(vaultProxy.connect(userB).withdrawERC721(erc721Token.address, 1, userB.address)).to.be.reverted
        expect(await erc721Token.ownerOf(1)).to.equal(vaultProxy.address)

        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);

      });

      it("Nonowner cannot withdraw ERC1155", async function () {
        expect(await vaultProxy.unlockTime()).to.not.equal(0);
        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);

        expect(await erc1155Token.balanceOf(userB.address, 1)).to.equal(0)
        expect(await erc1155Token.balanceOf(vaultProxy.address, 1)).to.equal(1)

        await expect(vaultProxy.connect(userB).withdrawERC1155(erc1155Token.address, 1, userB.address, 1)).to.be.reverted

        expect(await erc1155Token.balanceOf(userB.address, 1)).to.equal(0)
        expect(await erc1155Token.balanceOf(vaultProxy.address, 1)).to.equal(1)

        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);

      });

      it("Nonowner cannot withdraw CryptoPunk", async function () {
        expect(await vaultProxy.unlockTime()).to.not.equal(0);
        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);

        expect(await cryptoPunksToken.punkIndexToAddress(1)).to.equal(vaultProxy.address)
        await expect(vaultProxy.connect(userB).withdrawCryptoPunk(cryptoPunksToken.address, 1, userB.address)).to.be.reverted
        expect(await cryptoPunksToken.punkIndexToAddress(1)).to.equal(vaultProxy.address)

        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);

      });

      it("Nonowner cannot withdraw multiple tokens", async function () {

        expect(await vaultProxy.unlockTime()).to.not.equal(0);
        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);

        expect(await erc20Token.balanceOf(userA.address)).to.equal(0)
        expect(await erc20Token.balanceOf(userB.address)).to.equal(1)
        expect(await erc20Token.balanceOf(vaultProxy.address)).to.equal(1)
        expect(await erc721Token.ownerOf(1)).to.equal(vaultProxy.address)
        expect(await erc1155Token.balanceOf(userA.address, 1)).to.equal(0)
        expect(await erc1155Token.balanceOf(userB.address, 1)).to.equal(0)
        expect(await erc1155Token.balanceOf(vaultProxy.address, 1)).to.equal(1)
        expect(await cryptoPunksToken.punkIndexToAddress(1)).to.equal(vaultProxy.address)

        let ethWithdraw = { tokenType: TokenType.ETH, token: "0x0000000000000000000000000000000000000000", tokenId: 0, amount: ethers.utils.parseEther('1', 'ether') }
        let erc20Withdraw = { tokenType: TokenType.ERC20, token: erc20Token.address, tokenId: 0, amount: 1 }
        let erc721Withdraw = { tokenType: TokenType.ERC721, token: erc721Token.address, tokenId: 1, amount: 0 }
        let erc1155Withdraw = { tokenType: TokenType.ERC1155, token: erc1155Token.address, tokenId: 1, amount: 1 }
        let cryptopunkWithdraw = { tokenType: TokenType.CryptoPunk, token: cryptoPunksToken.address, tokenId: 1, amount: 0 }

        await expect(vaultProxy.connect(userB).withdrawMultiple([ethWithdraw, erc20Withdraw, erc721Withdraw, erc1155Withdraw, cryptopunkWithdraw], userA.address)).to.be.reverted

        expect(await erc20Token.balanceOf(userA.address)).to.equal(0)
        expect(await erc20Token.balanceOf(userB.address)).to.equal(1)
        expect(await erc20Token.balanceOf(vaultProxy.address)).to.equal(1)
        expect(await erc721Token.ownerOf(1)).to.equal(vaultProxy.address)
        expect(await erc1155Token.balanceOf(userA.address, 1)).to.equal(0)
        expect(await erc1155Token.balanceOf(userB.address, 1)).to.equal(0)
        expect(await erc1155Token.balanceOf(vaultProxy.address, 1)).to.equal(1)
        expect(await cryptoPunksToken.punkIndexToAddress(1)).to.equal(vaultProxy.address)

      });

    });

    describe("Unlocked", function () {

      let unlockTime;
      const unlockNote = "This is a very important message from the past."

      beforeEach("Deploy Factory & Tokens & Create a vault & Deposit", async () => {
        ({ vaultTeam, tokenTeam, userA, userB, userC, erc721Key, erc20Token, erc721Token, erc1155Token, cryptoPunksToken, vaultFactory } = await loadFixture(deployContracts));

        await vaultFactory.connect(userA).createVault(1);

        let vaultAddress = await vaultFactory.vaultOf(1);

        const VaultProxy = await ethers.getContractFactory("Vault");
        vaultProxy = VaultProxy.attach(vaultAddress);

        //Deposits
        await userA.sendTransaction({ to: vaultProxy.address, value: ethers.utils.parseEther('1', 'ether') })
        await erc20Token.connect(userA).transfer(vaultProxy.address, 1);
        await erc721Token.connect(userA)["safeTransferFrom(address,address,uint256)"](userA.address, vaultProxy.address, 1);
        await erc1155Token.connect(userA)["safeTransferFrom(address,address,uint256,uint256,bytes)"](userA.address, vaultProxy.address, 1, 1, [])
        await cryptoPunksToken.connect(userA).transferPunk(vaultProxy.address, 1);

        //Timelock
        unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;
        await vaultProxy.connect(userA).timelock(unlockTime, unlockNote);

        //Time travel
        await time.increaseTo(unlockTime);

      })

      it("Owner can withdraw ETH", async function () {
        expect(await vaultProxy.unlockTime()).to.not.equal(0);
        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);

        expect(
          await vaultProxy.connect(userA).withdrawETH(userA.address, ethers.utils.parseEther('1', 'ether').toString())
        ).to.changeEtherBalances(
          [vaultProxy, userA],
          [ethers.utils.parseEther('-1', 'ether'), ethers.utils.parseEther('1', 'ether')]
        );

        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);

      });

      it("Owner can withdraw ERC20", async function () {
        expect(await vaultProxy.unlockTime()).to.not.equal(0);
        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);

        expect(await erc20Token.balanceOf(userA.address)).to.equal(0)
        expect(await erc20Token.balanceOf(vaultProxy.address)).to.equal(1)

        await expect(vaultProxy.connect(userA).withdrawERC20(erc20Token.address, userA.address, 1)).not.to.be.reverted

        expect(await erc20Token.balanceOf(userA.address)).to.equal(1)
        expect(await erc20Token.balanceOf(vaultProxy.address)).to.equal(0)

        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);
      });

      it("Owner can withdraw ERC721", async function () {
        expect(await vaultProxy.unlockTime()).to.not.equal(0);
        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);

        expect(await erc721Token.ownerOf(1)).to.equal(vaultProxy.address)

        await expect(vaultProxy.connect(userA).withdrawERC721(erc721Token.address, 1, userA.address)).not.to.be.reverted
        expect(await erc721Token.ownerOf(1)).to.equal(userA.address)

        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);

      });

      it("Owner can withdraw ERC1155", async function () {
        expect(await vaultProxy.unlockTime()).to.not.equal(0);
        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);

        expect(await erc1155Token.balanceOf(userA.address, 1)).to.equal(0)
        expect(await erc1155Token.balanceOf(vaultProxy.address, 1)).to.equal(1)

        await expect(vaultProxy.connect(userA).withdrawERC1155(erc1155Token.address, 1, userA.address, 1)).not.to.be.reverted

        expect(await erc1155Token.balanceOf(userA.address, 1)).to.equal(1)
        expect(await erc1155Token.balanceOf(vaultProxy.address, 1)).to.equal(0)

        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);

      });

      it("Owner can withdraw CryptoPunk", async function () {
        expect(await vaultProxy.unlockTime()).to.not.equal(0);
        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);

        expect(await cryptoPunksToken.punkIndexToAddress(1)).to.equal(vaultProxy.address)

        await expect(vaultProxy.connect(userA).withdrawCryptoPunk(cryptoPunksToken.address, 1, userA.address)).not.to.be.reverted
        expect(await cryptoPunksToken.punkIndexToAddress(1)).to.equal(userA.address)

        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);

      });

      it("Owner can withdraw multiple tokens", async function () {
        expect(await vaultProxy.unlockTime()).to.not.equal(0);
        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);

        expect(await erc20Token.balanceOf(userA.address)).to.equal(0)
        expect(await erc20Token.balanceOf(vaultProxy.address)).to.equal(1)
        expect(await erc721Token.ownerOf(1)).to.equal(vaultProxy.address)
        expect(await erc1155Token.balanceOf(userA.address, 1)).to.equal(0)
        expect(await erc1155Token.balanceOf(userB.address, 1)).to.equal(0)
        expect(await erc1155Token.balanceOf(vaultProxy.address, 1)).to.equal(1)
        expect(await cryptoPunksToken.punkIndexToAddress(1)).to.equal(vaultProxy.address)


        let ethWithdraw = { tokenType: TokenType.ETH, token: "0x0000000000000000000000000000000000000000", tokenId: 0, amount: ethers.utils.parseEther('1', 'ether') }
        let erc20Withdraw = { tokenType: TokenType.ERC20, token: erc20Token.address, tokenId: 0, amount: 1 }
        let erc721Withdraw = { tokenType: TokenType.ERC721, token: erc721Token.address, tokenId: 1, amount: 0 }
        let erc1155Withdraw = { tokenType: TokenType.ERC1155, token: erc1155Token.address, tokenId: 1, amount: 1 }
        let cryptopunkWithdraw = { tokenType: TokenType.CryptoPunk, token: cryptoPunksToken.address, tokenId: 1, amount: 0 }

        expect(
          await vaultProxy.connect(userA).withdrawMultiple([ethWithdraw, erc20Withdraw, erc721Withdraw, erc1155Withdraw, cryptopunkWithdraw], userA.address)
        ).to.changeEtherBalances(
          [vaultProxy, userA],
          [ethers.utils.parseEther('-1', 'ether'), ethers.utils.parseEther('1', 'ether')]
        );

        expect(await erc20Token.balanceOf(userA.address)).to.equal(1)
        expect(await erc20Token.balanceOf(vaultProxy.address)).to.equal(0)
        expect(await erc721Token.ownerOf(1)).to.equal(userA.address)
        expect(await erc1155Token.balanceOf(userA.address, 1)).to.equal(1)
        expect(await erc1155Token.balanceOf(userB.address, 1)).to.equal(0)
        expect(await erc1155Token.balanceOf(vaultProxy.address, 1)).to.equal(0)
        expect(await cryptoPunksToken.punkIndexToAddress(1)).to.equal(userA.address)

        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);

      });


      it("Nonowner cannot withdraw ETH", async function () {
        expect(await vaultProxy.unlockTime()).to.not.equal(0);
        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);

        await expect(vaultProxy.connect(userB).withdrawETH(userA.address, ethers.utils.parseEther('1', 'ether').toString())).to.be.reverted;

        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);

      });

      it("Nonowner cannot withdraw ERC20", async function () {
        expect(await vaultProxy.unlockTime()).to.not.equal(0);
        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);

        expect(await erc20Token.balanceOf(userA.address)).to.equal(0)
        expect(await erc20Token.balanceOf(vaultProxy.address)).to.equal(1)

        await expect(vaultProxy.connect(userB).withdrawERC20(erc20Token.address, userA.address, 1)).to.be.reverted

        expect(await erc20Token.balanceOf(userA.address)).to.equal(0)
        expect(await erc20Token.balanceOf(vaultProxy.address)).to.equal(1)

        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);
      });

      it("Nonowner cannot withdraw ERC721", async function () {
        expect(await vaultProxy.unlockTime()).to.not.equal(0);
        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);

        expect(await erc721Token.ownerOf(1)).to.equal(vaultProxy.address)

        await expect(vaultProxy.connect(userB).withdrawERC721(erc721Token.address, 1, userA.address)).to.be.reverted
        expect(await erc721Token.ownerOf(1)).to.equal(vaultProxy.address)

        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);

      });

      it("Nonowner cannot withdraw ERC1155", async function () {
        expect(await vaultProxy.unlockTime()).to.not.equal(0);
        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);

        expect(await erc1155Token.balanceOf(userA.address, 1)).to.equal(0)
        expect(await erc1155Token.balanceOf(vaultProxy.address, 1)).to.equal(1)

        await expect(vaultProxy.connect(userB).withdrawERC1155(erc1155Token.address, 1, userA.address, 1)).to.be.reverted

        expect(await erc1155Token.balanceOf(userA.address, 1)).to.equal(0)
        expect(await erc1155Token.balanceOf(vaultProxy.address, 1)).to.equal(1)

        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);

      });

      it("Nonowner cannot withdraw CryptoPunk", async function () {
        expect(await vaultProxy.unlockTime()).to.not.equal(0);
        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);

        expect(await cryptoPunksToken.punkIndexToAddress(1)).to.equal(vaultProxy.address)

        await expect(vaultProxy.connect(userB).withdrawCryptoPunk(cryptoPunksToken.address, 1, userA.address)).to.be.reverted
        expect(await cryptoPunksToken.punkIndexToAddress(1)).to.equal(vaultProxy.address)

        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);

      });

      it("Nonowner cannot withdraw multiple tokens", async function () {

        expect(await vaultProxy.unlockTime()).to.not.equal(0);
        expect(await vaultProxy.unlockTime()).to.equal(unlockTime);

        expect(await erc20Token.balanceOf(userA.address)).to.equal(0)
        expect(await erc20Token.balanceOf(userB.address)).to.equal(1)
        expect(await erc20Token.balanceOf(vaultProxy.address)).to.equal(1)
        expect(await erc721Token.ownerOf(1)).to.equal(vaultProxy.address)
        expect(await erc1155Token.balanceOf(userA.address, 1)).to.equal(0)
        expect(await erc1155Token.balanceOf(userB.address, 1)).to.equal(0)
        expect(await erc1155Token.balanceOf(vaultProxy.address, 1)).to.equal(1)
        expect(await cryptoPunksToken.punkIndexToAddress(1)).to.equal(vaultProxy.address)

        let ethWithdraw = { tokenType: TokenType.ETH, token: "0x0000000000000000000000000000000000000000", tokenId: 0, amount: ethers.utils.parseEther('1', 'ether') }
        let erc20Withdraw = { tokenType: TokenType.ERC20, token: erc20Token.address, tokenId: 0, amount: 1 }
        let erc721Withdraw = { tokenType: TokenType.ERC721, token: erc721Token.address, tokenId: 1, amount: 0 }
        let erc1155Withdraw = { tokenType: TokenType.ERC1155, token: erc1155Token.address, tokenId: 1, amount: 1 }
        let cryptopunkWithdraw = { tokenType: TokenType.CryptoPunk, token: cryptoPunksToken.address, tokenId: 1, amount: 0 }

        await expect(vaultProxy.connect(userB).withdrawMultiple([ethWithdraw, erc20Withdraw, erc721Withdraw, erc1155Withdraw, cryptopunkWithdraw], userA.address)).to.be.reverted

        expect(await erc20Token.balanceOf(userA.address)).to.equal(0)
        expect(await erc20Token.balanceOf(userB.address)).to.equal(1)
        expect(await erc20Token.balanceOf(vaultProxy.address)).to.equal(1)
        expect(await erc721Token.ownerOf(1)).to.equal(vaultProxy.address)
        expect(await erc1155Token.balanceOf(userA.address, 1)).to.equal(0)
        expect(await erc1155Token.balanceOf(userB.address, 1)).to.equal(0)
        expect(await erc1155Token.balanceOf(vaultProxy.address, 1)).to.equal(1)
        expect(await cryptoPunksToken.punkIndexToAddress(1)).to.equal(vaultProxy.address)

      });

    });

  });

  //
  //  Ownership Transfer
  //

  describe("Ownership Transfer", function () {

    beforeEach("Deploy Factory & Tokens & Create a vault & Deposit & Transfer Key", async () => {
      ({ vaultTeam, tokenTeam, userA, userB, userC, erc721Key, erc20Token, erc721Token, erc1155Token, cryptoPunksToken, vaultFactory } = await loadFixture(deployContracts));

      await vaultFactory.connect(userA).createVault(1);

      let vaultAddress = await vaultFactory.vaultOf(1);

      const VaultProxy = await ethers.getContractFactory("Vault");
      vaultProxy = VaultProxy.attach(vaultAddress);

      //Deposits
      await userA.sendTransaction({ to: vaultProxy.address, value: ethers.utils.parseEther('1', 'ether') })
      await erc20Token.connect(userA).transfer(vaultProxy.address, 1);
      await erc721Token.connect(userA)["safeTransferFrom(address,address,uint256)"](userA.address, vaultProxy.address, 1);
      await erc1155Token.connect(userA)["safeTransferFrom(address,address,uint256,uint256,bytes)"](userA.address, vaultProxy.address, 1, 1, [])
      await cryptoPunksToken.connect(userA).transferPunk(vaultProxy.address, 1);

      //Ownership Transfer, Key token is transferred.
      await erc721Key.connect(userA)["safeTransferFrom(address,address,uint256)"](userA.address, userC.address, 1);

    })

    it("Vault correctly tracks key owner when transferred", async function () {
      expect(await vaultProxy.keyOwner()).to.equal(userC.address);
      await erc721Key.connect(userC)["safeTransferFrom(address,address,uint256)"](userC.address, userB.address, 1);
      expect(await vaultProxy.keyOwner()).to.equal(userB.address);
    });

    // New Owner

    it("New owner can withdraw ETH", async function () {
      expect(
        await vaultProxy.connect(userC).withdrawETH(userC.address, ethers.utils.parseEther('1', 'ether').toString())
      ).to.changeEtherBalances(
        [vaultProxy, userC],
        [ethers.utils.parseEther('-1', 'ether'), ethers.utils.parseEther('1', 'ether')]
      );

    });

    it("New owner can withdraw ERC20", async function () {
      expect(await erc20Token.balanceOf(userA.address)).to.equal(0)
      expect(await erc20Token.balanceOf(userC.address)).to.equal(0)
      expect(await erc20Token.balanceOf(vaultProxy.address)).to.equal(1)

      await expect(vaultProxy.connect(userC).withdrawERC20(erc20Token.address, userC.address, 1)).not.to.be.reverted

      expect(await erc20Token.balanceOf(userA.address)).to.equal(0)
      expect(await erc20Token.balanceOf(userC.address)).to.equal(1)
      expect(await erc20Token.balanceOf(vaultProxy.address)).to.equal(0)

    });

    it("New owner can withdraw ERC721", async function () {
      expect(await erc721Token.ownerOf(1)).to.equal(vaultProxy.address)
      await expect(vaultProxy.connect(userC).withdrawERC721(erc721Token.address, 1, userC.address)).not.to.be.reverted
      expect(await erc721Token.ownerOf(1)).to.equal(userC.address)
    });

    it("New owner can withdraw ERC1155", async function () {
      expect(await erc1155Token.balanceOf(userC.address, 1)).to.equal(0)
      expect(await erc1155Token.balanceOf(vaultProxy.address, 1)).to.equal(1)

      await expect(vaultProxy.connect(userC).withdrawERC1155(erc1155Token.address, 1, userC.address, 1)).not.to.be.reverted

      expect(await erc1155Token.balanceOf(userC.address, 1)).to.equal(1)
      expect(await erc1155Token.balanceOf(vaultProxy.address, 1)).to.equal(0)

    });

    it("New owner can withdraw CryptoPunk", async function () {
      expect(await cryptoPunksToken.punkIndexToAddress(1)).to.equal(vaultProxy.address)
      await expect(vaultProxy.connect(userC).withdrawCryptoPunk(cryptoPunksToken.address, 1, userC.address)).not.to.be.reverted
      expect(await cryptoPunksToken.punkIndexToAddress(1)).to.equal(userC.address)
    });

    it("New owner can withdraw multiple tokens", async function () {

      expect(await erc20Token.balanceOf(userA.address)).to.equal(0)
      expect(await erc20Token.balanceOf(userC.address)).to.equal(0)
      expect(await erc20Token.balanceOf(vaultProxy.address)).to.equal(1)
      expect(await erc721Token.ownerOf(1)).to.equal(vaultProxy.address)
      expect(await erc1155Token.balanceOf(userA.address, 1)).to.equal(0)
      expect(await erc1155Token.balanceOf(userC.address, 1)).to.equal(0)
      expect(await erc1155Token.balanceOf(vaultProxy.address, 1)).to.equal(1)
      expect(await cryptoPunksToken.punkIndexToAddress(1)).to.equal(vaultProxy.address)

      let ethWithdraw = { tokenType: TokenType.ETH, token: "0x0000000000000000000000000000000000000000", tokenId: 0, amount: ethers.utils.parseEther('1', 'ether') }
      let erc20Withdraw = { tokenType: TokenType.ERC20, token: erc20Token.address, tokenId: 0, amount: 1 }
      let erc721Withdraw = { tokenType: TokenType.ERC721, token: erc721Token.address, tokenId: 1, amount: 0 }
      let erc1155Withdraw = { tokenType: TokenType.ERC1155, token: erc1155Token.address, tokenId: 1, amount: 1 }
      let cryptopunkWithdraw = { tokenType: TokenType.CryptoPunk, token: cryptoPunksToken.address, tokenId: 1, amount: 0 }

      expect(
        await vaultProxy.connect(userC).withdrawMultiple([ethWithdraw, erc20Withdraw, erc721Withdraw, erc1155Withdraw, cryptopunkWithdraw], userC.address)
      ).to.changeEtherBalances(
        [vaultProxy, userC],
        [ethers.utils.parseEther('-1', 'ether'), ethers.utils.parseEther('1', 'ether')]
      );

      expect(await erc20Token.balanceOf(userA.address)).to.equal(0)
      expect(await erc20Token.balanceOf(userC.address)).to.equal(1)
      expect(await erc20Token.balanceOf(vaultProxy.address)).to.equal(0)
      expect(await erc721Token.ownerOf(1)).to.equal(userC.address)
      expect(await erc1155Token.balanceOf(userA.address, 1)).to.equal(0)
      expect(await erc1155Token.balanceOf(userC.address, 1)).to.equal(1)
      expect(await erc1155Token.balanceOf(vaultProxy.address, 1)).to.equal(0)
      expect(await cryptoPunksToken.punkIndexToAddress(1)).to.equal(userC.address)

    });

    it("New owner can timelock vault", async function () {
      const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;
      const unlockNote = "This is a very important message from the past."
      await expect(vaultProxy.connect(userC).timelock(unlockTime, unlockNote)).not.to.be.reverted
      expect(await vaultProxy.unlockTime()).to.equal(unlockTime, unlockNote);
    });

    // Prevoius Owner

    it("Previous owner cannot withdraw ETH", async function () {
      await expect(
        vaultProxy.connect(userA).withdrawETH(userA.address, ethers.utils.parseEther('1', 'ether').toString())
      ).to.be.reverted;
    });

    it("Previous owner cannot withdraw ERC20", async function () {
      expect(await erc20Token.balanceOf(userA.address)).to.equal(0)
      expect(await erc20Token.balanceOf(userB.address)).to.equal(1)
      expect(await erc20Token.balanceOf(userC.address)).to.equal(0)
      expect(await erc20Token.balanceOf(vaultProxy.address)).to.equal(1)

      await expect(vaultProxy.connect(userA).withdrawERC20(erc20Token.address, userA.address, 1)).to.be.reverted

      expect(await erc20Token.balanceOf(userA.address)).to.equal(0)
      expect(await erc20Token.balanceOf(userB.address)).to.equal(1)
      expect(await erc20Token.balanceOf(userC.address)).to.equal(0)
      expect(await erc20Token.balanceOf(vaultProxy.address)).to.equal(1)
    });

    it("Previous owner cannot withdraw ERC721", async function () {
      expect(await erc721Token.ownerOf(1)).to.equal(vaultProxy.address)
      await expect(vaultProxy.connect(userA).withdrawERC721(erc721Token.address, 1, userA.address)).to.be.reverted
      expect(await erc721Token.ownerOf(1)).to.equal(vaultProxy.address)
    });

    it("Previous owner cannot withdraw ERC1155", async function () {
      expect(await erc1155Token.balanceOf(userA.address, 1)).to.equal(0)
      expect(await erc1155Token.balanceOf(vaultProxy.address, 1)).to.equal(1)

      await expect(vaultProxy.connect(userA).withdrawERC1155(erc1155Token.address, 1, userA.address, 1)).to.be.reverted

      expect(await erc1155Token.balanceOf(userA.address, 1)).to.equal(0)
      expect(await erc1155Token.balanceOf(vaultProxy.address, 1)).to.equal(1)

    });

    it("Previous owner cannot withdraw CryptoPunk", async function () {
      expect(await cryptoPunksToken.punkIndexToAddress(1)).to.equal(vaultProxy.address)
      await expect(vaultProxy.connect(userA).withdrawCryptoPunk(cryptoPunksToken.address, 1, userA.address)).to.be.reverted
      expect(await cryptoPunksToken.punkIndexToAddress(1)).to.equal(vaultProxy.address)
    });

    it("Previous owner cannot withdraw multiple tokens", async function () {

      expect(await erc20Token.balanceOf(userA.address)).to.equal(0)
      expect(await erc20Token.balanceOf(userB.address)).to.equal(1)
      expect(await erc20Token.balanceOf(vaultProxy.address)).to.equal(1)
      expect(await erc721Token.ownerOf(1)).to.equal(vaultProxy.address)
      expect(await erc1155Token.balanceOf(userA.address, 1)).to.equal(0)
      expect(await erc1155Token.balanceOf(userB.address, 1)).to.equal(0)
      expect(await erc1155Token.balanceOf(vaultProxy.address, 1)).to.equal(1)
      expect(await cryptoPunksToken.punkIndexToAddress(1)).to.equal(vaultProxy.address)

      let ethWithdraw = { tokenType: TokenType.ETH, token: "0x0000000000000000000000000000000000000000", tokenId: 0, amount: ethers.utils.parseEther('1', 'ether') }
      let erc20Withdraw = { tokenType: TokenType.ERC20, token: erc20Token.address, tokenId: 0, amount: 1 }
      let erc721Withdraw = { tokenType: TokenType.ERC721, token: erc721Token.address, tokenId: 1, amount: 0 }
      let erc1155Withdraw = { tokenType: TokenType.ERC1155, token: erc1155Token.address, tokenId: 1, amount: 1 }
      let cryptopunkWithdraw = { tokenType: TokenType.CryptoPunk, token: cryptoPunksToken.address, tokenId: 1, amount: 0 }

      await expect(vaultProxy.connect(userA).withdrawMultiple([ethWithdraw, erc20Withdraw, erc721Withdraw, erc1155Withdraw, cryptopunkWithdraw], userA.address)).to.be.reverted

      expect(await erc20Token.balanceOf(userA.address)).to.equal(0)
      expect(await erc20Token.balanceOf(userB.address)).to.equal(1)
      expect(await erc20Token.balanceOf(vaultProxy.address)).to.equal(1)
      expect(await erc721Token.ownerOf(1)).to.equal(vaultProxy.address)
      expect(await erc1155Token.balanceOf(userA.address, 1)).to.equal(0)
      expect(await erc1155Token.balanceOf(userB.address, 1)).to.equal(0)
      expect(await erc1155Token.balanceOf(vaultProxy.address, 1)).to.equal(1)
      expect(await cryptoPunksToken.punkIndexToAddress(1)).to.equal(vaultProxy.address)

    });


    it("Previous owner cannot timelock vault", async function () {
      const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;
      const unlockNote = "This is a very important message from the past."
      await expect(vaultProxy.connect(userA).timelock(unlockTime, unlockNote)).to.be.reverted
      expect(await vaultProxy.unlockTime()).to.equal(0);
    });


    it("Each vault has independent ownership", async function () {

      //Vault 1 is owned by C now, Vault 2 is created by B, then C and B swap keys.

      await expect(vaultFactory.connect(userB).createVault(2)).not.to.be.reverted;

      let VaultProxy2 = await ethers.getContractFactory("Vault");
      let vaultAddress2 = await vaultFactory.vaultOf(2);
      vaultProxy2 = VaultProxy2.attach(vaultAddress2);

      expect(await vaultProxy.keyOwner()).to.equal(userC.address)
      expect(await vaultProxy2.keyOwner()).to.equal(userB.address)

      await erc721Key.connect(userC)["safeTransferFrom(address,address,uint256)"](userC.address, userB.address, 1);
      await erc721Key.connect(userB)["safeTransferFrom(address,address,uint256)"](userB.address, userC.address, 2);

      expect(await vaultProxy.keyOwner()).to.equal(userB.address)
      expect(await vaultProxy2.keyOwner()).to.equal(userC.address)

    });

  });

  describe("Key Recovery", function () {

    describe("Vault does not own vault key", function () {

      beforeEach("Deploy Factory & Tokens & Create a vault", async () => {
        ({ vaultTeam, tokenTeam, userA, userB, userC, erc721Key, erc20Token, erc721Token, erc1155Token, cryptoPunksToken, vaultFactory } = await loadFixture(deployContracts));

        await vaultFactory.connect(userA).createVault(1);

        let vaultAddress = await vaultFactory.vaultOf(1);

        const VaultProxy = await ethers.getContractFactory("Vault");
        vaultProxy = VaultProxy.attach(vaultAddress);

        //Deposits
        await userA.sendTransaction({ to: vaultProxy.address, value: ethers.utils.parseEther('1', 'ether') })
        await erc20Token.connect(userA).transfer(vaultProxy.address, 1);
        await erc721Token.connect(userA)["safeTransferFrom(address,address,uint256)"](userA.address, vaultProxy.address, 1);
        await erc1155Token.connect(userA)["safeTransferFrom(address,address,uint256,uint256,bytes)"](userA.address, vaultProxy.address, 1, 1, [])
        await cryptoPunksToken.connect(userA).transferPunk(vaultProxy.address, 1);
      })

      it("Owner cannot recover key", async function () {
        expect(await vaultProxy.keyOwner()).to.equal(userA.address);
        await expect(
          vaultProxy.connect(userA).recoverKey()
        ).to.be.reverted;
        expect(await vaultProxy.keyOwner()).to.equal(userA.address);
      });

      it("Nonowner cannot recover key", async function () {
        expect(await vaultProxy.keyOwner()).to.equal(userA.address);
        await expect(
          vaultProxy.connect(userB).recoverKey()
        ).to.be.reverted;
        expect(await vaultProxy.keyOwner()).to.equal(userA.address);
      });

      it("Vault factory owner cannot recover key", async function () {
        expect(await vaultProxy.keyOwner()).to.equal(userA.address);
        await expect(
          vaultProxy.connect(vaultTeam).recoverKey()
        ).to.be.reverted;
        expect(await vaultProxy.keyOwner()).to.equal(userA.address);

      });

    });

    describe("Vault owns vault key.", function () {

      beforeEach("Deploy Factory & Tokens & Create a vault & Deposit & Transfer Key", async () => {
        ({ vaultTeam, tokenTeam, userA, userB, userC, erc721Key, erc20Token, erc721Token, erc1155Token, cryptoPunksToken, vaultFactory } = await loadFixture(deployContracts));

        await vaultFactory.connect(userA).createVault(1);

        let vaultAddress = await vaultFactory.vaultOf(1);

        const VaultProxy = await ethers.getContractFactory("Vault");
        vaultProxy = VaultProxy.attach(vaultAddress);

        //Deposits
        await userA.sendTransaction({ to: vaultProxy.address, value: ethers.utils.parseEther('1', 'ether') })
        await erc20Token.connect(userA).transfer(vaultProxy.address, 1);
        await erc721Token.connect(userA)["safeTransferFrom(address,address,uint256)"](userA.address, vaultProxy.address, 1);
        await erc1155Token.connect(userA)["safeTransferFrom(address,address,uint256,uint256,bytes)"](userA.address, vaultProxy.address, 1, 1, [])
        await cryptoPunksToken.connect(userA).transferPunk(vaultProxy.address, 1);

        //Ownership Transfer, Key token is transferred to the vault.
        await erc721Key.connect(userA)["transferFrom(address,address,uint256)"](userA.address, vaultProxy.address, 1);

      })

      it("'Owner' cannot recover key", async function () {
        expect(await vaultProxy.keyOwner()).to.equal(vaultProxy.address);
        await expect(
          vaultProxy.connect(userA).recoverKey()
        ).to.be.reverted;
        expect(await vaultProxy.keyOwner()).to.equal(vaultProxy.address);
      });

      it("Nonowner cannot recover key", async function () {
        expect(await vaultProxy.keyOwner()).to.equal(vaultProxy.address);
        await expect(
          vaultProxy.connect(userB).recoverKey()
        ).to.be.reverted;
        expect(await vaultProxy.keyOwner()).to.equal(vaultProxy.address);
      });

      it("Vault factory owner can recover key", async function () {
        expect(await vaultProxy.keyOwner()).to.equal(vaultProxy.address);
        await expect(
          vaultProxy.connect(vaultTeam).recoverKey()
        ).not.to.be.reverted;
        expect(await vaultProxy.keyOwner()).to.equal(vaultTeam.address);
      });

    });


  });
});

