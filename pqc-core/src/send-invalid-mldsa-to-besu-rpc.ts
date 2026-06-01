import { Interface } from "ethers";
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
const pqNonce = BigInt(process.env.PQ_NONCE ?? "999");
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
const validSignature = signDigestMldsa(txDigest, keypair.secretKey);

const sigBytes = Buffer.from(validSignature.slice(2), "hex");
sigBytes[0] ^= 0xff;
const pqSignature = "0x" + sigBytes.toString("hex");

const localValidAfterTamper = verifyDigestMldsa(
  txDigest,
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
  data: calldata,
  pqAlgorithm,
  pqPublicKey: keypair.publicKey,
  pqSignature,
  sender
};

const jsonRpcPayload = {
  jsonrpc: "2.0",
  method: "eth_sendRawPqcTransaction",
  params: [rawPqcTransaction],
  id: 1
};

console.log("Algorithm:", pqAlgorithm);
console.log("Local valid after tamper:", localValidAfterTamper);
console.log("Sender:", sender);
console.log("pqNonce:", pqNonce.toString());
console.log("pqPublicKeyBytes:", (keypair.publicKey.length - 2) / 2);
console.log("pqSignatureBytes:", (pqSignature.length - 2) / 2);
console.log("canonicalTxBytes:", bytesToHex(canonicalTxBytes));
console.log("txDigest:", txDigest);
console.log("Submitting invalid ML-DSA tx to Besu RPC:", BESU_RPC_URL);
console.log("Method: eth_sendRawPqcTransaction");

const response = await fetch(BESU_RPC_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(jsonRpcPayload)
});

const body = await response.text();

console.log("Besu RPC HTTP status:", response.status);
console.log("Besu RPC response:");
console.log(body);
