import fs from "node:fs";
import path from "node:path";
import { ethers } from "hardhat";

const BUSINESS_CONTRACT_ADDRESS =
  "0x6fDfeb70f1b4D35A7E11A2687B7bAf367cDeB7aA";

const TX_HASH =
  process.env.TX_HASH ??
  "0xff24b269d6a51d9ab6d48eba33bde2a096b4fdd7fd3ecb2193891746cd49b6c8";

const PQC_SENDER =
  process.env.PQC_SENDER ??
  "0x1581bbb939c82f2d94f60675da2baf88ba0c104f";

async function main() {
  const provider = ethers.provider;

  const contract = await ethers.getContractAt(
    "BusinessContract",
    BUSINESS_CONTRACT_ADDRESS
  );

  const receipt = await provider.getTransactionReceipt(TX_HASH);
  const tx = await provider.getTransaction(TX_HASH);

  if (!receipt) {
    throw new Error(`Receipt not found for tx ${TX_HASH}`);
  }

  const block = await provider.getBlock(receipt.blockNumber);
  const counter = await contract.counters(PQC_SENDER);
  const trustedGatewayRelayer = await contract.trustedGatewayRelayer();

  const parsedLogs = [];

  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed) {
        parsedLogs.push({
          name: parsed.name,
          args: parsed.args.map((x: unknown) => x?.toString?.() ?? String(x))
        });
      }
    } catch {
      parsedLogs.push({
        raw: log
      });
    }
  }

  const evidence = {
    network: {
      chainId: (await provider.getNetwork()).chainId.toString(),
      rpc: "http://127.0.0.1:8545",
      consensus: "QBFT"
    },
    contract: {
      businessContract: BUSINESS_CONTRACT_ADDRESS,
      trustedGatewayRelayer
    },
    transaction: {
      hash: TX_HASH,
      from: tx?.from ?? null,
      to: tx?.to ?? null,
      nonce: tx?.nonce ?? null,
      blockNumber: receipt.blockNumber,
      status: receipt.status,
      gasUsed: receipt.gasUsed.toString()
    },
    block: {
      number: block?.number ?? null,
      hash: block?.hash ?? null,
      timestamp: block?.timestamp ?? null
    },
    pqc: {
      sender: PQC_SENDER,
      counterAfter: counter.toString()
    },
    logs: parsedLogs
  };

  const outDir = path.resolve("../results/receipts");
  fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, "plan-a-valid-mldsa-receipt.json");
  fs.writeFileSync(outPath, JSON.stringify(evidence, null, 2));

  console.log("Evidence saved to:", outPath);
  console.log(JSON.stringify(evidence, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
