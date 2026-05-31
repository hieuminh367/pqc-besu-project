import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying with:", deployer.address);

  const BusinessContract = await ethers.getContractFactory("BusinessContract");
  const contract = await BusinessContract.deploy(deployer.address);

  await contract.waitForDeployment();

  console.log("BusinessContract deployed to:", await contract.getAddress());
  console.log("Trusted gateway relayer:", deployer.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
