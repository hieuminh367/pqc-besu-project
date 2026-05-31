import { Interface } from "ethers";
import { derivePqcSenderAddress } from "./address.js";
import { encodeCanonicalTx } from "./canonical-encoder.js";
import { computeTxDigest } from "./tx-digest.js";
import {
  generateMldsaKeypair,
  signDigestMldsa,
  verifyDigestMldsa
} from "./mldsa.js";

const businessContractAbi = [
  "function executeFromPQC(address pqcSender, uint256 value)"
];

const GATEWAY_URL =
  process.env.GATEWAY_URL ?? "http://127.0.0.1:3001/submit-pqc-tx";

const chainId = 1337n;
const pqNonce = BigInt(process.env.PQ_NONCE ?? "777");
const to = "0x6fDfeb70f1b4D35A7E11A2687B7bAf367cDeB7aA";
const value = 0n;
const gasLimit = 800000n;
const gasPrice = 0n;
const pqAlgorithm = "ML-DSA-65";

const keypair = generateMldsaKeypair();
const sender = derivePqcSenderAddress(keypair.publicKey);

const iface = new Interface(businessContractAbi);

// Original calldata is signed.
const originalCalldata = iface.encodeFunctionData("executeFromPQC", [
  sender,
  7
]);

const originalCanonicalTxBytes = encodeCanonicalTx({
  type: "PQC_TRANSACTION",
  chainId,
  nonce: pqNonce,
  to,
  value,
  gasLimit,
  gasPrice,
  data: originalCalldata,
  pqAlgorithm
});

const originalTxDigest = computeTxDigest(originalCanonicalTxBytes);
const pqSignature = signDigestMldsa(originalTxDigest, keypair.secretKey);

const originalSignatureValid = verifyDigestMldsa(
  originalTxDigest,
  pqSignature,
  keypair.publicKey
);

// Tampered calldata is submitted.
// The signature is still the signature of originalCalldata.
const tamperedCalldata = iface.encodeFunctionData("executeFromPQC", [
  sender,
  8
]);

const tamperedCanonicalTxBytes = encodeCanonicalTx({
  type: "PQC_TRANSACTION",
  chainId,
  nonce: pqNonce,
  to,
  value,
  gasLimit,
  gasPrice,
  data: tamperedCalldata,
  pqAlgorithm
});

const tamperedTxDigest = computeTxDigest(tamperedCanonicalTxBytes);

const signatureValidAfterTamper = verifyDigestMldsa(
  tamperedTxDigest,
  pqSignature,
  keypair.publicKey
);

const rawPqcTransaction = {
  type: "PQC_TRANSACTION",
  chainId: chainId.toString(),
  pqNonce: pqNonce.toString(),
  to,
  value: value.toString(),
  gasLimit: gasLimit.toString(),
  gasPrice: gasPrice.toString(),
  data: tamperedCalldata,
  pqAlgorithm,
  pqPublicKey: keypair.publicKey,
  pqSignature,
  sender
};

console.log("Algorithm:", pqAlgorithm);
console.log("Sender:", sender);
console.log("pqNonce:", pqNonce.toString());
console.log("Original txDigest:", originalTxDigest);
console.log("Tampered txDigest:", tamperedTxDigest);
console.log("Original signature valid:", originalSignatureValid);
console.log("Signature valid after calldata tamper:", signatureValidAfterTamper);
console.log("Original calldata calls executeFromPQC(sender, 7)");
console.log("Tampered calldata calls executeFromPQC(sender, 8)");
console.log("Submitting tampered calldata tx to gateway:", GATEWAY_URL);

const response = await fetch(GATEWAY_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(rawPqcTransaction)
});

const body = await response.text();

console.log("Gateway HTTP status:", response.status);
console.log("Gateway response:");
console.log(body);

if (response.ok) {
  console.error("ERROR: Gateway accepted a tampered calldata transaction.");
  process.exitCode = 1;
}
