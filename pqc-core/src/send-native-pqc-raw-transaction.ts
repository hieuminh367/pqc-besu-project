import { Interface, encodeRlp, hexlify, toUtf8Bytes } from "ethers";
import { derivePqcSenderAddress } from "./address.js";
import { bytesToHex, encodeCanonicalTx } from "./canonical-encoder.js";
import { computeTxDigest } from "./tx-digest.js";
import {
  generateMldsaKeypair,
  signDigestMldsa,
  verifyDigestMldsa
} from "./mldsa.js";

const businessContractAbi = [
  "function executeFromPQC(address pqcSender, uint256 value)"
];

const BESU_RPC_URL =
  process.env.BESU_RPC_URL ?? "http://127.0.0.1:8545";

const chainId = 1337n;
const pqNonce = BigInt(process.env.PQ_NONCE ?? "1");
const accountNonce = pqNonce - 1n;
const to = "0x6fDfeb70f1b4D35A7E11A2687B7bAf367cDeB7aA";
const value = 0n;
const gasLimit = 800000n;
const gasPrice = 0n;
const pqAlgorithm = "ML-DSA-65";

function quantityToRlp(value: bigint): string {
  if (value === 0n) return "0x";
  let hex = value.toString(16);
  if (hex.length % 2 !== 0) hex = "0" + hex;
  return "0x" + hex;
}

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
  nonce: accountNonce,
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

const rlpBody = encodeRlp([
  quantityToRlp(chainId),
  quantityToRlp(accountNonce),
  quantityToRlp(gasPrice),
  quantityToRlp(gasLimit),
  to,
  quantityToRlp(value),
  calldata,
  hexlify(toUtf8Bytes(pqAlgorithm)),
  keypair.publicKey,
  pqSignature
]);

const rawNativePqcTransaction = "0x05" + rlpBody.slice(2);

console.log("Native transaction type:", "0x05");
console.log("Algorithm:", pqAlgorithm);
console.log("Local signatureValid:", signatureValid);
console.log("PQC sender:", sender);
console.log("pqNonce:", pqNonce.toString());
console.log("accountNonce:", accountNonce.toString());
console.log("pqPublicKeyBytes:", (keypair.publicKey.length - 2) / 2);
console.log("pqSignatureBytes:", (pqSignature.length - 2) / 2);
console.log("canonicalTxBytes:", bytesToHex(canonicalTxBytes));
console.log("txDigest:", txDigest);
console.log("rawNativePqcTransaction:", rawNativePqcTransaction);
console.log("Submitting to Besu RPC:", BESU_RPC_URL);
console.log("Method: eth_sendRawTransaction");

const response = await fetch(BESU_RPC_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    method: "eth_sendRawTransaction",
    params: [rawNativePqcTransaction],
    id: 1
  })
});

const body = await response.text();

console.log("Besu RPC HTTP status:", response.status);
console.log("Besu RPC response:");
console.log(body);
