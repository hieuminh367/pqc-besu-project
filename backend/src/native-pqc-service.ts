import { JsonRpcProvider, Wallet, encodeRlp, hexlify, toUtf8Bytes } from "ethers";
import { config } from "./config.js";
import { buildExecuteNativePqcCall } from "./contracts/native-pqc-contract.js";
import { derivePqcSenderAddress } from "../../pqc-core/src/address.js";
import { bytesToHex, encodeCanonicalTx } from "../../pqc-core/src/canonical-encoder.js";
import { computeTxDigest } from "../../pqc-core/src/tx-digest.js";
import {
  type MldsaKeypair,
  generateMldsaKeypair,
  signDigestMldsa,
  verifyDigestMldsa
} from "../../pqc-core/src/mldsa.js";

const provider = new JsonRpcProvider(config.besuRpcUrl);
const nativePqcWallet = generateMldsaKeypair();

export type NativeRawPqcTransaction = {
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

export type BuildNativePqcTransactionParams = {
  chainId: bigint;
  accountNonce: bigint;
  gasPrice: bigint;
  gasLimit: bigint;
  contractAddress: string;
  contractValue: bigint;
  keypair?: MldsaKeypair;
  pqAlgorithm?: string;
};

export type SendNativePqcTransactionInput = {
  nativePqcContractAddress: string;
  pqNonce?: string;
  contractValue: string;
  gasPrice?: string;
  debug?: boolean;
};

export type NativeNonceMode = "auto" | "manual";

export type NativeNonceSelection = {
  nonceMode: NativeNonceMode;
  pqNonce: bigint;
  accountNonce: bigint;
};

function quantityToRlp(value: bigint): string {
  if (value === 0n) return "0x";
  let hex = value.toString(16);
  if (hex.length % 2 !== 0) hex = "0" + hex;
  return `0x${hex}`;
}

export function resolveNativeNonceSelection({
  requestedPqNonce,
  pendingAccountNonce
}: {
  requestedPqNonce?: string;
  pendingAccountNonce: bigint;
}): NativeNonceSelection {
  if (
    requestedPqNonce === undefined ||
    requestedPqNonce.trim() === "" ||
    requestedPqNonce === "auto"
  ) {
    return {
      nonceMode: "auto",
      pqNonce: pendingAccountNonce + 1n,
      accountNonce: pendingAccountNonce
    };
  }

  const pqNonce = BigInt(requestedPqNonce);
  const accountNonce = pqNonce - 1n;

  if (accountNonce < 0n) {
    throw new Error("PQ_NONCE must be >= 1");
  }

  return {
    nonceMode: "manual",
    pqNonce,
    accountNonce
  };
}

export function buildNativePqcTransaction({
  chainId,
  accountNonce,
  gasPrice,
  gasLimit,
  contractAddress,
  contractValue,
  keypair = nativePqcWallet,
  pqAlgorithm = "ML-DSA-65"
}: BuildNativePqcTransactionParams) {
  const contractCall = buildExecuteNativePqcCall(contractAddress, contractValue);
  const pqcSender = derivePqcSenderAddress(keypair.publicKey);
  const value = 0n;

  const canonicalTxBytes = encodeCanonicalTx({
    type: "PQC_TRANSACTION",
    chainId,
    nonce: accountNonce,
    to: contractAddress,
    value,
    gasLimit,
    gasPrice,
    data: contractCall.data,
    pqAlgorithm
  });

  const txDigest = computeTxDigest(canonicalTxBytes);
  const pqSignature = signDigestMldsa(txDigest, keypair.secretKey);
  const signatureValid = verifyDigestMldsa(txDigest, pqSignature, keypair.publicKey);

  const rawPqcTransaction: NativeRawPqcTransaction = {
    type: "0x05",
    chainId: chainId.toString(),
    pqNonce: (accountNonce + 1n).toString(),
    to: contractAddress,
    value: value.toString(),
    gasLimit: gasLimit.toString(),
    gasPrice: gasPrice.toString(),
    data: contractCall.data,
    pqAlgorithm,
    pqPublicKey: keypair.publicKey,
    pqSignature,
    sender: pqcSender
  };

  const rlpBody = encodeRlp([
    quantityToRlp(chainId),
    quantityToRlp(accountNonce),
    quantityToRlp(gasPrice),
    quantityToRlp(gasLimit),
    contractAddress,
    quantityToRlp(value),
    contractCall.data,
    hexlify(toUtf8Bytes(pqAlgorithm)),
    keypair.publicKey,
    pqSignature
  ]);

  return {
    contractCall,
    pqcSender,
    txDigest,
    signatureValid,
    canonicalTxBytes: bytesToHex(canonicalTxBytes),
    rawPqcTransaction,
    rawNativePqcTransaction: `0x05${rlpBody.slice(2)}`,
    pqPublicKeyBytes: (keypair.publicKey.length - 2) / 2,
    pqSignatureBytes: (pqSignature.length - 2) / 2
  };
}

async function resolveGasPrice(preferredGasPrice?: string) {
  if (preferredGasPrice) {
    return BigInt(preferredGasPrice);
  }

  const feeData = await provider.getFeeData();
  const nodeGasPrice = feeData.gasPrice ?? 0n;
  return nodeGasPrice > 0n ? nodeGasPrice : 1000n;
}

async function readPendingAccountNonce(sender: string) {
  const quantity = await provider.send("eth_getTransactionCount", [sender, "pending"]);

  if (typeof quantity !== "string") {
    throw new Error("eth_getTransactionCount returned a non-hex nonce");
  }

  return BigInt(quantity);
}

async function fundSenderIfNeeded(sender: string, gasLimit: bigint, gasPrice: bigint) {
  const relayerPrivateKey = process.env.RELAYER_PRIVATE_KEY;
  if (!relayerPrivateKey) {
    return null;
  }

  const currentBalance = await provider.getBalance(sender);
  const requiredBalance = gasLimit * gasPrice + 1_000_000_000_000n;
  if (currentBalance >= requiredBalance) {
    return null;
  }

  const wallet = new Wallet(relayerPrivateKey, provider);
  const fundingTx = await wallet.sendTransaction({
    to: sender,
    value: requiredBalance,
    gasPrice
  });

  await fundingTx.wait();
  return fundingTx.hash;
}

let nativeSendQueue: Promise<void> = Promise.resolve();

function runNativeSendExclusive<T>(work: () => Promise<T>): Promise<T> {
  const task = nativeSendQueue.then(work, work);
  nativeSendQueue = task.then(
    () => undefined,
    () => undefined
  );
  return task;
}

async function sendNativePqcTransactionInternal(input: SendNativePqcTransactionInput) {
  const chainId = BigInt(config.chainId);
  const gasLimit = 800000n;
  const gasPrice = await resolveGasPrice(input.gasPrice);
  const contractValue = BigInt(input.contractValue);
  const pendingAccountNonce = await readPendingAccountNonce(
    derivePqcSenderAddress(nativePqcWallet.publicKey)
  );
  const nonceSelection = resolveNativeNonceSelection({
    requestedPqNonce: input.pqNonce,
    pendingAccountNonce
  });

  const built = buildNativePqcTransaction({
    chainId,
    accountNonce: nonceSelection.accountNonce,
    gasPrice,
    gasLimit,
    contractAddress: input.nativePqcContractAddress,
    contractValue
  });

  const fundingTxHash = await fundSenderIfNeeded(built.pqcSender, gasLimit, gasPrice);

  const response = await fetch(config.besuRpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_sendRawTransaction",
      params: [built.rawNativePqcTransaction],
      id: 1
    })
  });

  const rpcBodyText = await response.text();
  let rpcBody: { result?: string; error?: { message?: string } } = {};

  try {
    rpcBody = JSON.parse(rpcBodyText) as { result?: string; error?: { message?: string } };
  } catch {
    rpcBody = {};
  }

  const txHash = rpcBody.result ?? null;
  const ok = response.ok && typeof txHash === "string" && !rpcBody.error;

  return {
    ok,
    error: ok ? undefined : rpcBody.error?.message ?? rpcBodyText,
    nonceMode: nonceSelection.nonceMode,
    txHash,
    fundingTxHash,
    rpcHttpStatus: response.status,
    rpcResponseBody: rpcBodyText,
    pendingAccountNonce: pendingAccountNonce.toString(),
    pqNonce: nonceSelection.pqNonce.toString(),
    accountNonce: nonceSelection.accountNonce.toString(),
    contractValue: contractValue.toString(),
    gasPrice: gasPrice.toString(),
    gasLimit: gasLimit.toString(),
    localVerification: {
      txDigest: built.txDigest,
      signatureValid: built.signatureValid,
      pqPublicKeyBytes: built.pqPublicKeyBytes,
      pqSignatureBytes: built.pqSignatureBytes
    },
    rawPqcTransaction: built.rawPqcTransaction,
    rawNativePqcTransaction: input.debug ? built.rawNativePqcTransaction : null,
    pqcDump: {
      nativeTransactionType: built.rawPqcTransaction.type,
      algorithm: built.rawPqcTransaction.pqAlgorithm,
      abiFunction: built.contractCall.functionName,
      pqcSender: built.pqcSender,
      txDigest: built.txDigest,
      chainId: built.rawPqcTransaction.chainId,
      accountNonce: nonceSelection.accountNonce.toString(),
      to: built.rawPqcTransaction.to,
      gasPrice: built.rawPqcTransaction.gasPrice,
      gasLimit: built.rawPqcTransaction.gasLimit,
      contractCall: built.contractCall.functionName,
      abiCalldata: built.contractCall.data,
      contractValue: contractValue.toString(),
      canonicalTxBytes: built.canonicalTxBytes,
      rawNativePqcTransaction: input.debug ? built.rawNativePqcTransaction : null,
      rawNativePqcTransactionBytes: String((built.rawNativePqcTransaction.length - 2) / 2),
      pqPublicKeyBytes: String(built.pqPublicKeyBytes),
      pqSignatureBytes: String(built.pqSignatureBytes),
      pqPublicKey: built.rawPqcTransaction.pqPublicKey,
      pqSignature: built.rawPqcTransaction.pqSignature,
      fundingTxHash
    },
    txDigest: built.txDigest,
    pqcSender: built.pqcSender,
    signatureValid: built.signatureValid
  };
}

export async function sendNativePqcTransaction(
  input: SendNativePqcTransactionInput
) {
  return runNativeSendExclusive(() => sendNativePqcTransactionInternal(input));
}
