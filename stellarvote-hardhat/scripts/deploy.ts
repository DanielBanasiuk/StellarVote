import { ethers } from "hardhat";

async function main() {
  console.log("Deploying StellarVoteCore...");
  const factory = await ethers.getContractFactory("StellarVoteCore");
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log("StellarVoteCore deployed at:", address);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


