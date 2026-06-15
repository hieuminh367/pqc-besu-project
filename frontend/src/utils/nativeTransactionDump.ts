import type { NativePqcTransactionResponse } from "../api/client";

type DumpContext = {
  backendUrl: string;
  counterAfter?: string | null;
  health?: {
    chainId?: string;
    besuRpcUrl?: string;
    nativePqcContractAddress?: string;
  } | null;
  txDump?: any;
};

export function buildNativeTransactionDump(
  lastTx: NativePqcTransactionResponse,
  { backendUrl, counterAfter, health, txDump }: DumpContext
) {
  const rawTx = lastTx.rawPqcTransaction;
  const local = lastTx.localVerification;
  const receiptStatus = lastTx.receipt?.status ?? null;
  const blockNumber = lastTx.receipt?.blockNumber ?? lastTx.latestBlock ?? null;
  const txHash = lastTx.txHash;

  if (!rawTx || !local) {
    return null;
  }

  const fallbackCounterAfter = (() => {
    const data = lastTx.receipt?.logs?.[0]?.data;
    if (typeof data !== "string" || !data.startsWith("0x") || data.length < 130) {
      return lastTx.contractValue;
    }
    return BigInt(`0x${data.slice(66, 130)}`).toString();
  })();

  return {
    title: "Native PQC Besu Transaction Dump",
    note:
      "This dump shows the ABI-generated contract call, native PQC transaction fields, ML-DSA-65 proof data, and the mined Besu transaction.",
    network: {
      chainId: health?.chainId ?? "1337",
      consensus: "QBFT",
      besuRpc: health?.besuRpcUrl,
      backend: backendUrl
    },
    contractCall: {
      contractAddress: rawTx.to,
      functionName: "executeNativePQC(uint256)",
      pqcSender: lastTx.pqcSender ?? rawTx.sender,
      value: lastTx.contractValue,
      abiCalldata: rawTx.data
    },
    nativePqcTransaction: {
      type: rawTx.type,
      chainId: rawTx.chainId,
      pqNonce: rawTx.pqNonce,
      to: rawTx.to,
      value: rawTx.value,
      gasLimit: rawTx.gasLimit,
      gasPrice: rawTx.gasPrice,
      data: rawTx.data,
      pqAlgorithm: rawTx.pqAlgorithm,
      sender: rawTx.sender,
      pqPublicKey: rawTx.pqPublicKey,
      pqSignature: rawTx.pqSignature
    },
    canonicalSigning: {
      domainSeparator: "PQC_BESU_TX_V1",
      txDigest: local.txDigest,
      signatureAlgorithm: rawTx.pqAlgorithm,
      signatureValidLocally: local.signatureValid,
      pqPublicKeyBytes: local.pqPublicKeyBytes,
      pqSignatureBytes: local.pqSignatureBytes,
      senderDerivation: "last20Bytes(keccak256(pqPublicKey))"
    },
    nativePqcValidation: {
      accepted: lastTx.ok,
      signatureValid: local.signatureValid,
      nonceMode: lastTx.nonceMode ?? "auto",
      pqNonce: lastTx.pqNonce,
      accountNonce: lastTx.accountNonce ?? lastTx.pqcDump?.accountNonce ?? null,
      derivedSender: lastTx.pqcSender ?? rawTx.sender,
      txDigest: lastTx.txDigest ?? local.txDigest
    },
    besuExecution: {
      submittedBy: "backend native Plan B endpoint",
      besuTxHash: txHash,
      receiptStatus,
      blockNumber,
      counterAfter: counterAfter ?? fallbackCounterAfter
    },
    stateReadback: {
      nativePqcContractAddress: health?.nativePqcContractAddress ?? rawTx.to,
      pqcSender: rawTx.sender,
      counterAfter: counterAfter ?? fallbackCounterAfter
    },
    blockEvidence: txDump?.result?.receipt
      ? {
          blockHash: txDump.result.receipt.blockHash,
          gasUsed: txDump.result.receipt.gasUsed,
          from: txDump.result.receipt.from,
          to: txDump.result.receipt.to,
          logs: txDump.result.receipt.logs
        }
      : null
  };
}
