import { ethers } from "ethers";
import dotenv from "dotenv";

// Load .env
dotenv.config();

async function main() {
  console.log("🔍 Checking wallet setup...\n");
  
  // Check environment variables
  console.log("📋 Environment Variables:");
  const hasPrivateKey = !!process.env.PRIVATE_KEY;
  const hasRPC = !!process.env.BASE_SEPOLIA_RPC;
  
  console.log(`  PRIVATE_KEY: ${hasPrivateKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`  BASE_SEPOLIA_RPC: ${hasRPC ? '✅ Set (custom)' : '⚠️  Using default RPC'}`);
  
  if (!hasPrivateKey) {
    console.error("\n❌ PRIVATE_KEY is required! Add it to .env file.");
    process.exit(1);
  }
  
  // Connect to Base Sepolia
  const rpcUrl = process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org";
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  console.log("\n🌐 Network Connection:");
  console.log(`  RPC: ${rpcUrl}`);
  
  try {
    const network = await provider.getNetwork();
    console.log(`  Network: ${network.name}`);
    console.log(`  Chain ID: ${network.chainId}`);
    
    if (network.chainId !== 84532n) {
      console.log("\n⚠️  WARNING: Not connected to Base Sepolia (expected chain ID: 84532)");
    } else {
      console.log("   ✅ Connected to Base Sepolia!");
    }
  } catch (error) {
    console.error("\n❌ Failed to connect to network:");
    console.error(`   ${error.message}`);
    process.exit(1);
  }
  
  // Create wallet
  console.log("\n🔑 Wallet Information:");
  try {
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    console.log(`  Address: ${wallet.address}`);
    
    // Check ETH balance
    const balance = await provider.getBalance(wallet.address);
    const balanceInEth = ethers.formatEther(balance);
    console.log(`  ETH Balance: ${balanceInEth} ETH`);
    
    if (balance === 0n) {
      console.log("\n⚠️  WARNING: Wallet has 0 ETH!");
      console.log("   Get testnet ETH from faucets:");
      console.log("   - https://portal.cdp.coinbase.com/products/faucet");
      console.log("   - https://www.alchemy.com/faucets/base-sepolia");
    } else {
      console.log("   ✅ Wallet has ETH for gas!");
    }
    
    // Check USDC balance
    const usdcAddress = process.env.USDC_ADDRESS || "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
    console.log(`\n💵 USDC Balance (${usdcAddress}):`);
    
    try {
      const usdcAbi = [
        "function balanceOf(address account) view returns (uint256)"
      ];
      const usdc = new ethers.Contract(usdcAddress, usdcAbi, provider);
      const usdcBalance = await usdc.balanceOf(wallet.address);
      const usdcFormatted = ethers.formatUnits(usdcBalance, 6);
      console.log(`  USDC Balance: ${usdcFormatted} USDC`);
      
      if (usdcBalance === 0n) {
        console.log("\n⚠️  WARNING: Wallet has 0 USDC!");
        console.log("   Get testnet USDC from:");
        console.log("   - https://faucet.circle.com/ (select Base Sepolia)");
      } else {
        console.log("   ✅ Wallet has USDC for testing!");
      }
    } catch (error) {
      console.log("   ⚠️  Could not check USDC balance");
    }
    
    console.log("\n✅ Wallet verification complete!");
    
    if (balance > 0n) {
      console.log("\n🚀 Ready to deploy contracts!");
      console.log("   Next: Deploy with `make deploy-testnet`");
    } else {
      console.log("\n📝 Next steps:");
      console.log("   1. Get testnet ETH from faucets (links above)");
      console.log("   2. Get testnet USDC from https://faucet.circle.com/");
      console.log("   3. Run this script again to verify");
      console.log("   4. Deploy with `make deploy-testnet`");
    }
    
  } catch (error) {
    console.error("\n❌ Error verifying wallet:");
    console.error(`   ${error.message}`);
    if (error.message.includes("invalid private key") || error.message.includes("invalid hex")) {
      console.error("\n   Check your PRIVATE_KEY in .env:");
      console.error("   - Should be 64 hex characters (no 0x prefix)");
      console.error("   - Example: abc123...def456");
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
