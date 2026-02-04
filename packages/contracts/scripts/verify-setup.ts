import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
  console.log("🔍 Verifying Base Sepolia setup...\n");
  
  // Check environment variables
  console.log("📋 Environment Variables:");
  const hasPrivateKey = !!process.env.PRIVATE_KEY;
  const hasRPC = !!process.env.BASE_SEPOLIA_RPC;
  const hasBasescan = !!process.env.BASESCAN_API_KEY;
  const hasUSDC = !!process.env.USDC_ADDRESS;
  
  console.log(`  PRIVATE_KEY: ${hasPrivateKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`  BASE_SEPOLIA_RPC: ${hasRPC ? '✅ Set' : '⚠️  Not set (will use default)'}`);
  console.log(`  BASESCAN_API_KEY: ${hasBasescan ? '✅ Set' : '⚠️  Not set (verification disabled)'}`);
  console.log(`  USDC_ADDRESS: ${hasUSDC ? '✅ Set' : '⚠️  Not set (will use default)'}`);
  
  if (!hasPrivateKey) {
    console.error("\n❌ PRIVATE_KEY is required! Add it to .env file.");
    process.exit(1);
  }
  
  // Check private key format
  console.log("\n🔑 Wallet Information:");
  try {
    const [signer] = await ethers.getSigners();
    const address = await signer.getAddress();
    console.log(`  Address: ${address}`);
    
    // Check balance
    const balance = await ethers.provider.getBalance(address);
    const balanceInEth = ethers.formatEther(balance);
    console.log(`  Balance: ${balanceInEth} ETH`);
    
    if (balance === 0n) {
      console.log("\n⚠️  WARNING: Wallet has 0 ETH!");
      console.log("   Get testnet ETH from faucets:");
      console.log("   - https://portal.cdp.coinbase.com/products/faucet");
      console.log("   - https://www.alchemy.com/faucets/base-sepolia");
    } else {
      console.log("   ✅ Wallet has ETH for gas!");
    }
    
    // Check USDC balance if address provided
    const usdcAddress = process.env.USDC_ADDRESS || "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
    console.log(`\n💵 USDC Balance (${usdcAddress}):`);
    
    try {
      const usdc = await ethers.getContractAt(
        ["function balanceOf(address account) external view returns (uint256)"],
        usdcAddress
      );
      const usdcBalance = await usdc.balanceOf(address);
      const usdcFormatted = ethers.formatUnits(usdcBalance, 6);
      console.log(`  Balance: ${usdcFormatted} USDC`);
      
      if (usdcBalance === 0n) {
        console.log("\n⚠️  WARNING: Wallet has 0 USDC!");
        console.log("   Get testnet USDC from:");
        console.log("   - https://faucet.circle.com/ (select Base Sepolia)");
      } else {
        console.log("   ✅ Wallet has USDC for testing!");
      }
    } catch (error) {
      console.log("   ⚠️  Could not check USDC balance (token may not exist at this address)");
    }
    
    // Check network
    console.log("\n🌐 Network Information:");
    const network = await ethers.provider.getNetwork();
    console.log(`  Network: ${network.name}`);
    console.log(`  Chain ID: ${network.chainId}`);
    
    if (network.chainId !== 84532n) {
      console.log("\n⚠️  WARNING: Not connected to Base Sepolia (expected chain ID: 84532)");
    } else {
      console.log("   ✅ Connected to Base Sepolia!");
    }
    
    console.log("\n✅ Setup verification complete!");
    
    if (balance > 0n && network.chainId === 84532n) {
      console.log("\n🚀 Ready to deploy! Run: make deploy-testnet");
    } else {
      console.log("\n📝 Next steps:");
      if (balance === 0n) {
        console.log("   1. Get testnet ETH from faucets");
      }
      console.log("   2. Get testnet USDC from https://faucet.circle.com/");
      console.log("   3. Run: make deploy-testnet");
    }
    
  } catch (error) {
    console.error("\n❌ Error verifying wallet:");
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
      if (error.message.includes("invalid private key")) {
        console.error("\n   Check your PRIVATE_KEY in .env:");
        console.error("   - Should be 64 hex characters (no 0x prefix)");
        console.error("   - Example: abc123...def456");
      }
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
