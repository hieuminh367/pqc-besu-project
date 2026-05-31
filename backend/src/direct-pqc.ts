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

export type DirectPqcResult = {
  rawPqcTransaction: RawPqcTransaction;
  localVerification: {
    txDigest: string;
    signatureValid: boolean;
    pqPublicKeyBytes: number;
    pqSignatureBytes: number;
  };
  gateway: unknown;
};

export async function sendValidMldsaDirect(
  input: DirectPqcRequest
): Promise<DirectPqcResult> {
  const chainId = BigInt(config.chainId);
  const pqNonce = BigInt(input.pqNonce ?? "1");
  const contractValue = BigInt(input.value ?? "7");

  const to = config.businessContractAddress;
  const value = 0n;
  const gasLimit = 800000n;
  const gasPrice = 0n;
  const pqAlgorithm = "ML-DSA-65";

  const keypair = generateMldsaKeypair();
  const sender = derivePqcSenderAddress(keypair.publicKey);

  const iface = new Interface(businessContractAbi);
  const calldata = iface.encodeFunctionData("executeFromPQC", [
    sender,
    contractValue
  ]);

  const canonicalTxBytes = encodeCanonicalTx({
    type: "PQC_TRANSACTION",
    chainId,
    nonce: pqNonce,
    to,
    value,
    gasLimit,
    gasPrice,
    data: calldata,
    pqAlgorithm
  });

  const txDigest = computeTxDigest(canonicalTxBytes);
  const pqSignature = signDigestMldsa(txDigest, keypair.secretKey);

  const signatureValid = verifyDigestMldsa(
    txDigest,
    pqSignature,
    keypair.publicKey
  );

  const rawPqcTransaction: RawPqcTransaction = {
    type: "PQC_TRANSACTION",
    chainId: chainId.toString(),
    pqNonce: pqNonce.toString(),
    to,
    value: value.toString(),
    gasLimit: gasLimit.toString(),
    gasPrice: gasPrice.toString(),
    data: calldata,
    pqAlgorithm,
    pqPublicKey: keypair.publicKey,
    pqSignature,
    sender
  };

  const response = await fetch(config.gatewaySubmitUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(rawPqcTransaction)
  });

  const responseText = await response.text();

  let gateway: unknown;
  try {
    gateway = JSON.parse(responseText);
  } catch {
    gateway = {
      raw: responseText
    };
  }

  if (!response.ok) {
    return {
      rawPqcTransaction,
      localVerification: {
        txDigest,
        signatureValid,
        pqPublicKeyBytes: (keypair.publicKey.length - 2) / 2,
        pqSignatureBytes: (pqSignature.length - 2) / 2
      },
      gateway
    };
  }

  return {
    rawPqcTransaction,
    localVerification: {
      txDigest,
      signatureValid,
      pqPublicKeyBytes: (keypair.publicKey.length - 2) / 2,
      pqSignatureBytes: (pqSignature.length - 2) / 2
    },
    gateway
  };
}
