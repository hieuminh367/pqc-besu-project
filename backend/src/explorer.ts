import { JsonRpcProvider } from "ethers";
import { config } from "./config.js";

export type ExplorerBlock = {
  number: number;
  hash: string | null;
  timestamp: number;
  txCount: number;
  gasUsed: string;
  parentHash: string;
};

export type ExplorerTx = {
  hash: string;
  blockNumber: number | null;
  from: string | null;
  to: string | null;
  nonce: number | null;
  data: string | null;
  value: string | null;
  gasLimit: string | null;
  gasPrice: string | null;
};

export async function getExplorerOverview(limit = 8) {
  const provider = new JsonRpcProvider(config.besuRpcUrl);
  const network = await provider.getNetwork();
  const latestBlockNumber = await provider.getBlockNumber();

  const blocks: ExplorerBlock[] = [];

  for (let i = latestBlockNumber; i >= 0 && blocks.length < limit; i--) {
    const block = await provider.getBlock(i);
    if (!block) continue;

    blocks.push({
      number: block.number,
      hash: block.hash,
      timestamp: block.timestamp,
      txCount: block.transactions.length,
      gasUsed: block.gasUsed.toString(),
      parentHash: block.parentHash
    });
  }

  return {
    chainId: network.chainId.toString(),
    latestBlockNumber,
    blocks
  };
}

export async function getTxDump(txHash: string) {
  const provider = new JsonRpcProvider(config.besuRpcUrl);
  const tx = await provider.getTransaction(txHash);
  const receipt = await provider.getTransactionReceipt(txHash);

  if (!tx) {
    throw new Error(`Transaction not found: ${txHash}`);
  }

  return {
    indexed_txo: [],
    raw: tx.data,
    spends: null,
    tx: {
      blockhash: receipt?.blockHash ?? null,
      blocktime: null,
      confirmations: receipt
        ? (await provider.getBlockNumber()) - receipt.blockNumber + 1
        : 0,
      hash: tx.hash,
      hex: tx.data,
      locktime: 0,
      size: tx.data ? Math.ceil((tx.data.length - 2) / 2) : 0,
      time: null,
      txid: tx.hash,
      version: 1,
      vin: [
        {
          txid: "native-pqc-transaction",
          vout: tx.nonce,
          scriptSig: {
            asm: "ML-DSA-65 native PQC transaction",
            hex: ""
          },
          sequence: tx.nonce,
          txinwitness: []
        }
      ],
      vout: [
        {
          n: 0,
          value: tx.value.toString(),
          scriptPubKey: {
            address: tx.to,
            asm: "NativePQCBusinessContract.executeNativePQC",
            hex: tx.data,
            type: "besu_contract_call"
          }
        }
      ],
      vsize: tx.data ? Math.ceil((tx.data.length - 2) / 2) : 0,
      weight: tx.data ? Math.ceil((tx.data.length - 2) / 2) * 4 : 0
    },
    txid: tx.hash,
    receipt: receipt
      ? {
          status: receipt.status,
          blockNumber: receipt.blockNumber,
          blockHash: receipt.blockHash,
          gasUsed: receipt.gasUsed.toString(),
          from: receipt.from,
          to: receipt.to,
          logs: receipt.logs
        }
      : null
  };
}
