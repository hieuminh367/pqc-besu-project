import type { BackendHealth } from "../types";

const BACKEND_URL = "/api";

async function requestJson<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return data as T;
}

export type ExplorerBlock = {
  number: number;
  hash: string | null;
  timestamp: number;
  txCount: number;
  gasUsed: string;
  parentHash: string;
};

export type ExplorerOverview = {
  ok: boolean;
  result: {
    chainId: string;
    latestBlockNumber: number;
    blocks: ExplorerBlock[];
  };
};

export type NativeCounterResponse = {
  ok: boolean;
  contractAddress: string;
  sender: string;
  counter: string;
};

export type NativePqcLocalVerification = {
  txDigest: string;
  signatureValid: boolean;
  pqPublicKeyBytes: number;
  pqSignatureBytes: number;
};

export type NativePqcRawTransaction = {
  type: string;
  chainId: string;
  pqNonce: string;
  to: string;
  value: string;
  gasLimit: string;
  gasPrice: string;
  data: string;
  pqAlgorithm: string;
  pqPublicKey: string;
  pqSignature: string;
  sender: string;
};

export type NativePqcReceipt = {
  status?: string;
  blockNumber?: string;
  transactionHash?: string;
  from?: string;
  to?: string;
  type?: string;
  logs?: Array<{ data?: string; topics?: string[] }>;
};

export type NativePqcDump = {
  nativeTransactionType?: string;
  algorithm?: string;
  abiFunction?: string;
  pqcSender?: string | null;
  txDigest?: string | null;
  chainId?: string;
  accountNonce?: string | null;
  to?: string | null;
  gasPrice?: string | null;
  gasLimit?: string | null;
  abiCalldata?: string | null;
  contractCall?: string | null;
  contractValue?: string | null;
  rawNativePqcTransaction?: string | null;
  rawNativePqcTransactionBytes?: string | null;
  pqPublicKeyBytes?: string | null;
  pqSignatureBytes?: string | null;
  pqPublicKey?: string | null;
  pqSignature?: string | null;
  fundingTxHash?: string | null;
  receiptStatus?: string | null;
  receiptType?: string | null;
  blockNumber?: string | null;
  transactionHash?: string | null;
  canonicalTxBytes?: string | null;
};

export type NativePqcTransactionResponse = {
  ok: boolean;
  mode: string;
  nonceMode?: "auto" | "manual";
  abiFunction: string;
  rpcMethod: string;
  nativeTransactionType: string;
  nativePqcContractAddress: string;
  pqNonce: string;
  accountNonce?: string;
  pendingAccountNonce?: string;
  contractValue: string;
  txHash: string | null;
  pqcSender: string | null;
  txDigest: string | null;
  localVerification?: NativePqcLocalVerification;
  receipt: NativePqcReceipt | null;
  latestBlock: string | null;
  rawPqcTransaction?: NativePqcRawTransaction | null;
  rawNativePqcTransaction?: string | null;
  pqcDump?: NativePqcDump;
  stdout: string;
  stderr: string;
  error?: string;
};

export type BuildNativePqcRequestBodyInput = {
  contractAddress: string;
  value: string;
  pqNonce?: string;
  gasPrice?: string;
  waitReceipt?: boolean;
  debug?: boolean;
};

export function buildNativePqcRequestBody({
  contractAddress,
  value,
  pqNonce = "auto",
  gasPrice = "1000",
  waitReceipt = true,
  debug = false
}: BuildNativePqcRequestBodyInput) {
  return {
    nativePqcContractAddress: contractAddress,
    value,
    pqNonce,
    gasPrice,
    waitReceipt,
    debug
  };
}

export const api = {
  backendUrl: BACKEND_URL,

  health(): Promise<BackendHealth> {
    return requestJson<BackendHealth>("/health");
  },

  overview(): Promise<ExplorerOverview> {
    return requestJson<ExplorerOverview>("/explorer/overview?limit=8");
  },

  txDump(txHash: string): Promise<any> {
    return requestJson<any>(`/explorer/tx/${txHash}`);
  },

  nativeCounter(
    sender: string,
    contractAddress?: string
  ): Promise<NativeCounterResponse> {
    const search = contractAddress
      ? `?contractAddress=${encodeURIComponent(contractAddress)}`
      : "";
    return requestJson<NativeCounterResponse>(
      `/plan-b/native-counter/${encodeURIComponent(sender)}${search}`
    );
  },

  sendNativePqc(
    input: BuildNativePqcRequestBodyInput
  ): Promise<NativePqcTransactionResponse> {
    return requestJson<NativePqcTransactionResponse>("/plan-b/native-buy", {
      method: "POST",
      body: JSON.stringify(buildNativePqcRequestBody(input))
    });
  },

};
