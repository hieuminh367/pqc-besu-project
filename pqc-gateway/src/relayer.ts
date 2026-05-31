import { Contract, JsonRpcProvider, Wallet } from "ethers";

const BUSINESS_ABI = [
  "function executeFromPQC(address pqcSender, uint256 value)",
  "function counters(address pqcSender) view returns (uint256)",
  "function trustedGatewayRelayer() view returns (address)"
];

export type RelayResult = {
  txHash: string;
  receiptStatus: number | null;
  blockNumber: number | null;
  counterAfter: string;
};

export async function relayToBesu(params: {
  rpcUrl: string;
  relayerPrivateKey: string;
  contractAddress: string;
  pqcSender: string;
  value: bigint;
}): Promise<RelayResult> {
  const provider = new JsonRpcProvider(params.rpcUrl);
  const wallet = new Wallet(params.relayerPrivateKey, provider);

  const contract = new Contract(
    params.contractAddress,
    BUSINESS_ABI,
    wallet
  );

  const tx = await contract.executeFromPQC(params.pqcSender, params.value);
  const receipt = await tx.wait();

  const counterAfter = await contract.counters(params.pqcSender);

  return {
    txHash: tx.hash,
    receiptStatus: receipt?.status ?? null,
    blockNumber: receipt?.blockNumber ?? null,
    counterAfter: counterAfter.toString()
  };
}
