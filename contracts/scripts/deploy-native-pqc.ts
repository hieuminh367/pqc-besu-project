import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying NativePQCBusinessContract with:", deployer.address);

  const Factory = await ethers.getContractFactory("NativePQCBusinessContract");
  const contract = await Factory.deploy();

  await contract.waitForDeployment();

  console.log("NativePQCBusinessContract deployed to:", await contract.getAddress());
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
