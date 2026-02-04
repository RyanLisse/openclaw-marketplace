import { ethers } from "hardhat";
import { Marketplace } from "../typechain-types";

// USDC on Base Sepolia
const USDC_ADDRESS = process.env.USDC_ADDRESS || "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

async function main() {
  const marketplaceAddress = process.argv[2];
  if (!marketplaceAddress) {
    console.error("Usage: npx hardhat run scripts/test-marketplace.ts --network base-sepolia <marketplace_address>");
    process.exit(1);
  }
  
  console.log("Testing Marketplace at:", marketplaceAddress);
  
  const [creator, provider] = await ethers.getSigners();
  console.log("Creator:", creator.address);
  console.log("Provider:", provider.address);
  
  // Connect to deployed Marketplace
  const marketplace = await ethers.getContractAt("Marketplace", marketplaceAddress) as Marketplace;
  
  // Connect to USDC token
  const usdc = await ethers.getContractAt(
    ["function approve(address spender, uint256 amount) external returns (bool)",
     "function balanceOf(address account) external view returns (uint256)",
     "function transfer(address to, uint256 amount) external returns (bool)"],
    USDC_ADDRESS
  );
  
  const amount = ethers.parseUnits("10", 6); // 10 USDC (6 decimals)
  
  console.log("\n=== Step 1: Check USDC balance ===");
  const balance = await usdc.balanceOf(creator.address);
  console.log("Creator USDC balance:", ethers.formatUnits(balance, 6));
  
  if (balance < amount) {
    console.error("Insufficient USDC! Get testnet USDC from a faucet first.");
    console.log("Base Sepolia USDC Faucet: https://faucet.circle.com/");
    process.exit(1);
  }
  
  console.log("\n=== Step 2: Approve Marketplace to spend USDC ===");
  const approveTx = await usdc.connect(creator).approve(marketplaceAddress, amount);
  await approveTx.wait();
  console.log("Approved:", amount.toString(), "USDC");
  
  console.log("\n=== Step 3: Create Intent ===");
  const metadataURI = "ipfs://QmTest123"; // In production, this would be IPFS hash with intent details
  const createTx = await marketplace.connect(creator).createIntent(
    USDC_ADDRESS,
    amount,
    metadataURI
  );
  const receipt = await createTx.wait();
  
  // Extract intentId from event
  const event = receipt?.logs
    .map(log => {
      try {
        return marketplace.interface.parseLog({
          topics: log.topics as string[],
          data: log.data
        });
      } catch {
        return null;
      }
    })
    .find(e => e?.name === "IntentCreated");
  
  const intentId = event?.args?.intentId;
  console.log("Intent created! ID:", intentId?.toString());
  
  // Check intent details
  const intent = await marketplace.intents(intentId);
  console.log("Intent details:");
  console.log("  Creator:", intent.creator);
  console.log("  Amount:", ethers.formatUnits(intent.amount, 6), "USDC");
  console.log("  Status:", ["Active", "InProgress", "Completed", "Cancelled", "Disputed"][intent.status]);
  
  console.log("\n=== Step 4: Assign Provider ===");
  const assignTx = await marketplace.connect(creator).assignProvider(intentId, provider.address);
  await assignTx.wait();
  console.log("Provider assigned:", provider.address);
  
  // Check updated status
  const intentAfterAssign = await marketplace.intents(intentId);
  console.log("Intent status:", ["Active", "InProgress", "Completed", "Cancelled", "Disputed"][intentAfterAssign.status]);
  
  console.log("\n=== Step 5: Complete Intent ===");
  const providerBalanceBefore = await usdc.balanceOf(provider.address);
  console.log("Provider USDC balance before:", ethers.formatUnits(providerBalanceBefore, 6));
  
  const completeTx = await marketplace.connect(creator).completeIntent(intentId);
  await completeTx.wait();
  console.log("Intent completed!");
  
  const providerBalanceAfter = await usdc.balanceOf(provider.address);
  console.log("Provider USDC balance after:", ethers.formatUnits(providerBalanceAfter, 6));
  console.log("Provider received:", ethers.formatUnits(providerBalanceAfter - providerBalanceBefore, 6), "USDC");
  
  // Check final status
  const intentFinal = await marketplace.intents(intentId);
  console.log("Final intent status:", ["Active", "InProgress", "Completed", "Cancelled", "Disputed"][intentFinal.status]);
  
  console.log("\n✅ All tests passed! Marketplace is working on testnet.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
