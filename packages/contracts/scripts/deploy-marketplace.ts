import { ethers, upgrades } from "hardhat";

async function main() {
  console.log("Deploying Marketplace (UUPS Proxy)...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy Marketplace as upgradeable proxy
  const Marketplace = await ethers.getContractFactory("Marketplace");
  const marketplace = await upgrades.deployProxy(
    Marketplace,
    [deployer.address, deployer.address], // defaultAdmin, upgrader
    { kind: "uups" }
  );
  
  await marketplace.waitForDeployment();
  const address = await marketplace.getAddress();
  
  console.log("Marketplace deployed to:", address);
  console.log("Implementation address:", await upgrades.erc1967.getImplementationAddress(address));
  
  // Verify on Basescan (optional)
  if (process.env.BASESCAN_API_KEY) {
    console.log("Waiting 30s before verification...");
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    try {
      await hre.run("verify:verify", {
        address: await upgrades.erc1967.getImplementationAddress(address),
        constructorArguments: [],
      });
      console.log("Contract verified on Basescan");
    } catch (error) {
      console.error("Verification failed:", error);
    }
  }
  
  return address;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
