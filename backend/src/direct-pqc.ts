
import { Interface } from "ethers";
import { config } from "./config.js";
import { derivePqcSenderAddress } from "../../pqc-core/src/address.js";
import { encodeCanonicalTx } from "../../pqc-core/src/canonical-encoder.js";
import { computeTxDigest } from "../../pqc-core/src/tx-digest.js";
import {
  generateMldsaKeypair,
  signDigestMldsa,
  verifyDigestMldsa
} from "../../pqc-core/src/mldsa.js";

const businessContractAbi = [
  "function executeFromPQC(address pqcSender, uint256 value)"
];

/*
 * Backend direct mode simulates a dApp wallet.
 * The keypair is stable while the backend process is running.
 */
const backendMldsaWallet = generateMldsaKeypair();
const backendPqcSender = derivePqcSenderAddress(backendMldsaWallet.publicKey);

let nextAutoNonce = 1n;

export type DirectPqcRequest = {
  pqNonce?: string | number;
  value?: string | number;
};

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

export type GatewayResult = {
  accepted?: boolean;
  signatureValid?: boolean;
  pqNonceValid?: boolean;
  derivedSender?: string;
  txDigest?: string;
  stage?: string;
  reason?: string;
  expectedNonce?: string;
  relay?: {
    txHash: string;
    receiptStatus: number;
    blockNumber: number;
    counterAfter: string;
  };
};

export type DirectPqcResult = {
  wallet: {
    sender: string;
    nonceMode: "auto" | "manual";
    nextAutoNonce: string;
  };
  rawPqcTransaction: RawPqcTransaction;
  localVerification: {
    txDigest: string;
    signatureValid: boolean;
    pqPublicKeyBytes: number;
    pqSignatureBytes: number;
  };
  gateway: GatewayResult;
};

function buildRawPqcTransaction(params: {
  pqNonce: bigint;
  contractValue: bigint;
}) {
  const chainId = BigInt(config.chainId);
  const to = config.businessContractAddress;
  const value = 0n;
  const gasLimit = 800000n;
  const gasPrice = 0n;
  const pqAlgorithm = "ML-DSA-65";

  const iface = new Interface(businessContractAbi);
  const calldata = iface.encodeFunctionData("executeFromPQC", [
    backendPqcSender,
    params.contractValue
  ]);

  const canonicalTxBytes = encodeCanonicalTx({
    type: "PQC_TRANSACTION",
    chainId,
    nonce: params.pqNonce,
    to,
    value,
    gasLimit,
    gasPrice,
    data: calldata,
    pqAlgorithm
  });

  const txDigest = computeTxDigest(canonicalTxBytes);
  const pqSignature = signDigestMldsa(
    txDigest,
    backendMldsaWallet.secretKey
  );

  const signatureValid = verifyDigestMldsa(
    txDigest,
    pqSignature,
    backendMldsaWallet.publicKey
  );

  const rawPqcTransaction: RawPqcTransaction = {
    type: "PQC_TRANSACTION",
    chainId: chainId.toString(),
    pqNonce: params.pqNonce.toString(),
    to,
    value: value.toString(),
    gasLimit: gasLimit.toString(),
    gasPrice: gasPrice.toString(),
    data: calldata,
    pqAlgorithm,
    pqPublicKey: backendMldsaWallet.publicKey,
    pqSignature,
    sender: backendPqcSender
  };

  return {
    rawPqcTransaction,
    localVerification: {
      txDigest,
      signatureValid,
      pqPublicKeyBytes: (backendMldsaWallet.publicKey.length - 2) / 2,
      pqSignatureBytes: (pqSignature.length - 2) / 2
    }
  };
}

async function submitToGateway(rawPqcTransaction: RawPqcTransaction) {
  const response = await fetch(config.gatewaySubmitUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(rawPqcTransaction)
  });

  const responseText = await response.text();

  let gateway: GatewayResult;
  try {
    gateway = JSON.parse(responseText) as GatewayResult;
  } catch {
    gateway = {
      accepted: false,
      reason: responseText
    };
  }

  return gateway;
}

export async function sendValidMldsaDirect(
  input: DirectPqcRequest
): Promise<DirectPqcResult> {
  const nonceMode =
    input.pqNonce === undefined || String(input.pqNonce) === "auto"
      ? "auto"
      : "manual";

  const contractValue = BigInt(input.value ?? "7");

  let pqNonce =
    nonceMode === "auto" ? nextAutoNonce : BigInt(input.pqNonce ?? "1");

  let built = buildRawPqcTransaction({
    pqNonce,
    contractValue
  });

  let gateway = await submitToGateway(built.rawPqcTransaction);

  /*
   * If backend restarted but gateway kept nonce memory,
   * sync to gateway expectedNonce once.
   */
  if (
    nonceMode === "auto" &&
    !gateway.accepted &&
    gateway.stage === "nonce-check" &&
    gateway.expectedNonce
  ) {
    pqNonce = BigInt(gateway.expectedNonce);

    built = buildRawPqcTransaction({
      pqNonce,
      contractValue
    });

    gateway = await submitToGateway(built.rawPqcTransaction);
  }

  if (nonceMode === "auto" && gateway.accepted) {
    nextAutoNonce = pqNonce + 1n;
  }

  return {
    wallet: {
      sender: backendPqcSender,
      nonceMode,
      nextAutoNonce: nextAutoNonce.toString()
    },
    rawPqcTransaction: built.rawPqcTransaction,
    localVerification: built.localVerification,
    gateway
  };
}