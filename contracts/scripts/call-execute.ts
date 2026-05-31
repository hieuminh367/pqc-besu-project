import { ethers } from "hardhat";

const BUSINESS_CONTRACT_ADDRESS =
  "0x6fDfeb70f1b4D35A7E11A2687B7bAf367cDeB7aA";

async function main() {
  const [relayer] = await ethers.getSigners();

  const pqcSender = "0x1111111111111111111111111111111111111111";
  const value = 7;

  console.log("Relayer:", relayer.address);
  console.log("PQC sender:", pqcSender);

  const contract = await ethers.getContractAt(
    "BusinessContract",
    BUSINESS_CONTRACT_ADDRESS
  );

  const beforeCounter = await contract.counters(pqcSender);
  console.log("Counter before:", beforeCounter.toString());

  const tx = await contract.executeFromPQC(pqcSender, value);
  console.log("Tx hash:", tx.hash);

  const receipt = await tx.wait();
  console.log("Receipt status:", receipt?.status);
  console.log("Block number:", receipt?.blockNumber);

  const afterCounter = await contract.counters(pqcSender);
  console.log("Counter after:", afterCounter.toString());

  const trustedRelayer = await contract.trustedGatewayRelayer();
  console.log("Trusted gateway relayer:", trustedRelayer);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
