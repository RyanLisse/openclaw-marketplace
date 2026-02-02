import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

describe("Marketplace & ReputationSBT", function () {
    let marketplace: any;
    let reputation: any;
    let mockToken: any;
    let owner: any;
    let user1: any;
    let provider1: any;
    let amount = ethers.parseEther("100");

    before(async function () {
        [owner, user1, provider1] = await ethers.getSigners();

        // Deploy Mock ERC20
        const MockToken = await ethers.getContractFactory("MockERC20");
        mockToken = await MockToken.deploy("Mock USDC", "mUSDC");

        // Deploy ReputationSBT
        const Reputation = await ethers.getContractFactory("ReputationSBT");
        reputation = await upgrades.deployProxy(Reputation, [owner.address, owner.address, owner.address], { initializer: 'initialize' });

        // Deploy Marketplace
        const Marketplace = await ethers.getContractFactory("Marketplace");
        marketplace = await upgrades.deployProxy(Marketplace, [owner.address, owner.address], { initializer: 'initialize' });

        // Distribute tokens
        await mockToken.mint(user1.address, amount);
    });

    it("Should create an intent and escrow funds", async function () {
        await mockToken.connect(user1).approve(await marketplace.getAddress(), amount);

        await expect(marketplace.connect(user1).createIntent(
            await mockToken.getAddress(),
            amount,
            "ipfs://metadata"
        )).to.emit(marketplace, "IntentCreated");

        // Check balance of marketplace
        expect(await mockToken.balanceOf(await marketplace.getAddress())).to.equal(amount);
    });

    it("Should assign a provider", async function () {
        // Assuming intentId 0
        await marketplace.connect(user1).assignProvider(0, provider1.address);
        const intent = await marketplace.intents(0);
        expect(intent.provider).to.equal(provider1.address);
        expect(Number(intent.status)).to.equal(1); // InProgress
    });

    it("Should complete intent and release funds", async function () {
        const balanceBefore = await mockToken.balanceOf(provider1.address);
        await marketplace.connect(user1).completeIntent(0);
        const balanceAfter = await mockToken.balanceOf(provider1.address);

        expect(balanceAfter - balanceBefore).to.equal(amount);
        const intent = await marketplace.intents(0);
        expect(Number(intent.status)).to.equal(2); // Completed
    });

    it("Should allow minting reputation", async function () {
        await reputation.safeMint(provider1.address, "ipfs://rep");
        expect(await reputation.ownerOf(0)).to.equal(provider1.address);
    });

    it("Should NOT allow transfer of reputation (Soulbound)", async function () {
        await expect(
            reputation.connect(provider1).transferFrom(provider1.address, user1.address, 0)
        ).to.be.revertedWith("ReputationSBT: Token is Soulbound (non-transferable)");
    });
});
