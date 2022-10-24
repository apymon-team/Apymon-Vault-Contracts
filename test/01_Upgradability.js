const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

const { deployContracts } = require("./shared/utilities")

var vaultTeam, tokenTeam, userA, userB, userC, erc721Key, erc20Token, erc721Token, erc1155Token, cryptoPunksToken, vaultFactory, vaultImplementation;

describe("Upgradability", function () {

    describe("Vault Factory", function () {

        beforeEach("Deploy Factory & Tokens & Create a vault & Deposit & Transfer", async () => {
            ({ vaultTeam, tokenTeam, userA, userB, userC, erc721Key, erc20Token, erc721Token, erc1155Token, cryptoPunksToken, vaultFactory, vaultImplementation } = await loadFixture(deployContracts));

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

            //Ownership Transfer, Key token is transfered.
            await erc721Key.connect(userA)["safeTransferFrom(address,address,uint256)"](userA.address, userC.address, 1);

        })

        it("Owner can upgrade vault factory", async function () {
            expect(await vaultFactory.owner()).to.equal(vaultTeam.address);

            const VaultFactoryMockUpgrade = await ethers.getContractFactory("VaultFactoryMockUpgrade");
            const vaultFactoryMockUpgradeImplementation = await VaultFactoryMockUpgrade.connect(vaultTeam).deploy();

            await expect(vaultFactory.connect(vaultTeam).upgradeTo(vaultFactoryMockUpgradeImplementation.address)).not.to.be.reverted
        });

        it("Nonowner cannot upgrade vault factory", async function () {
            expect(await vaultFactory.owner()).to.equal(vaultTeam.address);

            const VaultFactoryMockUpgrade = await ethers.getContractFactory("VaultFactoryMockUpgrade");
            const vaultFactoryMockUpgradeImplementation = await VaultFactoryMockUpgrade.connect(tokenTeam).deploy();

            await expect(vaultFactory.connect(tokenTeam).upgradeTo(vaultFactoryMockUpgradeImplementation.address)).to.be.reverted;
        });

        it("Upgrade emits an event", async function () {
            const VaultFactoryMockUpgrade = await ethers.getContractFactory("VaultFactoryMockUpgrade");
            const vaultFactoryMockUpgradeImplementation = await VaultFactoryMockUpgrade.connect(vaultTeam).deploy();

            await expect(vaultFactory.connect(vaultTeam).upgradeTo(vaultFactoryMockUpgradeImplementation.address)).to.emit(vaultFactory, 'Upgraded').withArgs(anyValue);
        });


        describe("Post Upgrade", function () {

            it("Owner still owns contract", async function () {
                const VaultFactoryMockUpgrade = await ethers.getContractFactory("VaultFactoryMockUpgrade");
                const vaultFactoryMockUpgradeImplementation = await VaultFactoryMockUpgrade.connect(vaultTeam).deploy();

                await expect(vaultFactory.connect(vaultTeam).upgradeTo(vaultFactoryMockUpgradeImplementation.address)).not.to.be.reverted

                const upgradedVaultFactory = VaultFactoryMockUpgrade.attach(vaultFactory.address);

                expect(await upgradedVaultFactory.owner()).to.equal(vaultTeam.address);

            });

            it("Existing vaults remain mapped", async function () {
                expect(await vaultFactory.vaultOf(1)).to.equal(vaultProxy.address);

                const VaultFactoryMockUpgrade = await ethers.getContractFactory("VaultFactoryMockUpgrade");
                const vaultFactoryMockUpgradeImplementation = await VaultFactoryMockUpgrade.connect(vaultTeam).deploy();

                await expect(vaultFactory.connect(vaultTeam).upgradeTo(vaultFactoryMockUpgradeImplementation.address)).not.to.be.reverted

                const upgradedVaultFactory = VaultFactoryMockUpgrade.attach(vaultFactory.address);

                expect(await upgradedVaultFactory.vaultOf(1)).to.equal(vaultProxy.address);

            });

            it("New mock function present and working", async function () {

                const VaultFactoryMockUpgrade = await ethers.getContractFactory("VaultFactoryMockUpgrade");
                const vaultFactoryMockUpgradeImplementation = await VaultFactoryMockUpgrade.connect(vaultTeam).deploy();

                await expect(vaultFactory.connect(vaultTeam).upgradeTo(vaultFactoryMockUpgradeImplementation.address)).not.to.be.reverted

                const upgradedVaultFactory = VaultFactoryMockUpgrade.attach(vaultFactory.address);

                expect(await upgradedVaultFactory.VAULT_IMPLEMENTATION_CONTRACT()).to.equal(vaultImplementation.address)

                await expect(upgradedVaultFactory.mockNewImplementation('0x0000000000000000000000000000000000000123')).not.to.be.reverted

                expect(await upgradedVaultFactory.VAULT_IMPLEMENTATION_CONTRACT()).to.equal('0x0000000000000000000000000000000000000123')

            });
        });

    });

});

