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
const pqNonce = BigInt(process.env.PQ_NONCE ?? "1");
const to = "0x6fDfeb70f1b4D35A7E11A2687B7bAf367cDeB7aA";
const value = 0n;
const gasLimit = 800000n;
const gasPrice = 0n;
const pqAlgorithm = "ML-DSA-65";

const keypair = generateMldsaKeypair();
const sender = derivePqcSenderAddress(keypair.publicKey);

const iface = new Interface(businessContractAbi);
const calldata = iface.encodeFunctionData("executeFromPQC", [
  sender,
  7
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
const signatureValid = verifyDigestMldsa(txDigest, pqSignature, keypair.publicKey);

const rawPqcTransaction = {
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

console.log("Algorithm:", pqAlgorithm);
console.log("Local signatureValid:", signatureValid);
console.log("Sender:", sender);
console.log("pqNonce:", pqNonce.toString());
console.log("pqPublicKeyBytes:", (keypair.publicKey.length - 2) / 2);
console.log("pqSignatureBytes:", (pqSignature.length - 2) / 2);
console.log("txDigest:", txDigest);
console.log("Submitting to gateway:", GATEWAY_URL);

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

if (!response.ok) {
  process.exitCode = 1;
}
