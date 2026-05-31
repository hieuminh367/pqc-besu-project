import crypto from "node:crypto";
import { Interface } from "ethers";
import { derivePqcSenderAddress } from "./address.js";
import { encodeCanonicalTx } from "./canonical-encoder.js";
import { signDigestDemo } from "./sign.js";
import { computeTxDigest } from "./tx-digest.js";
import { verifyDigestDemo } from "./verify.js";

const businessContractAbi = [
  "function executeFromPQC(address pqcSender, uint256 value)"
];

const GATEWAY_URL =
  process.env.GATEWAY_URL ?? "http://127.0.0.1:3001/submit-pqc-tx";

const chainId = 1337n;
const pqNonce = BigInt(process.env.PQ_NONCE ?? "999");
const to = "0x6fDfeb70f1b4D35A7E11A2687B7bAf367cDeB7aA";
const value = 0n;
const gasLimit = 800000n;
const gasPrice = 0n;
const pqAlgorithm = "DEMO-ED25519";

const fixedPrivateKeyPem = `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEIF7VbpRbE9yT3RO+pq2KTN7j9+wUXt1K1W8c7KG+3U8k
-----END PRIVATE KEY-----`;

const privateKey = crypto.createPrivateKey(fixedPrivateKeyPem);
const publicKey = crypto.createPublicKey(privateKey);
const publicKeyDer = publicKey.export({
  type: "spki",
  format: "der"
});

const pqPublicKey = "0x" + Buffer.from(publicKeyDer).toString("hex");
const sender = derivePqcSenderAddress(pqPublicKey);

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
const validSignature = signDigestDemo(txDigest, fixedPrivateKeyPem);

// Tamper one byte of the signature.
const sigBytes = Buffer.from(validSignature.slice(2), "hex");
sigBytes[0] ^= 0xff;
const pqSignature = "0x" + sigBytes.toString("hex");

const localValidAfterTamper = verifyDigestDemo(txDigest, pqSignature, pqPublicKey);

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
  pqPublicKey,
  pqSignature,
  sender
};

console.log("Local valid after tamper:", localValidAfterTamper);
console.log("Sender:", sender);
console.log("pqNonce:", pqNonce.toString());
console.log("txDigest:", txDigest);
console.log("Submitting invalid signature tx to gateway:", GATEWAY_URL);

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
