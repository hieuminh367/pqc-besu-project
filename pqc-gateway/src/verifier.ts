import { getBytes } from "ethers";
import {
  encodeCanonicalTx,
  type CanonicalTxFields
} from "../../pqc-core/src/canonical-encoder.js";
import { computeTxDigest } from "../../pqc-core/src/tx-digest.js";
import { derivePqcSenderAddress } from "../../pqc-core/src/address.js";
import { verifyDigestDemo } from "../../pqc-core/src/verify.js";

export type RawPqcTransaction = {
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

export type VerificationResult = {
  accepted: boolean;
  reason?: string;
  derivedSender?: string;
  txDigest?: string;
};

export function verifyRawPqcTransaction(
  rawTx: RawPqcTransaction
): VerificationResult {
  if (rawTx.type !== "PQC_TRANSACTION") {
    return { accepted: false, reason: "invalid transaction type" };
  }

  if (rawTx.pqAlgorithm !== "DEMO-ED25519") {
    return { accepted: false, reason: "unsupported pqAlgorithm" };
  }

  try {
    getBytes(rawTx.pqPublicKey);
    getBytes(rawTx.pqSignature);
    getBytes(rawTx.data);
  } catch {
    return { accepted: false, reason: "invalid hex field" };
  }

  const derivedSender = derivePqcSenderAddress(rawTx.pqPublicKey);

  if (derivedSender.toLowerCase() !== rawTx.sender.toLowerCase()) {
    return {
      accepted: false,
      reason: "sender mismatch",
      derivedSender
    };
  }

  const fields: CanonicalTxFields = {
    type: rawTx.type,
    chainId: BigInt(rawTx.chainId),
    nonce: BigInt(rawTx.pqNonce),
    to: rawTx.to,
    value: BigInt(rawTx.value),
    gasLimit: BigInt(rawTx.gasLimit),
    gasPrice: BigInt(rawTx.gasPrice),
    data: rawTx.data,
    pqAlgorithm: rawTx.pqAlgorithm
  };

  const canonicalTxBytes = encodeCanonicalTx(fields);
  const txDigest = computeTxDigest(canonicalTxBytes);

  const signatureValid = verifyDigestDemo(
    txDigest,
    rawTx.pqSignature,
    rawTx.pqPublicKey
  );

  if (!signatureValid) {
    return {
      accepted: false,
      reason: "invalid signature",
      derivedSender,
      txDigest
    };
  }

  return {
    accepted: true,
    derivedSender,
    txDigest
  };
}
