import { Interface } from "ethers";
import { derivePqcSenderAddress } from "./address.js";
import { bytesToHex, encodeCanonicalTx } from "./canonical-encoder.js";
import { generateDemoKeypair, signDigestDemo } from "./sign.js";
import { computeTxDigest } from "./tx-digest.js";
import { verifyDigestDemo } from "./verify.js";

const businessContractAbi = [
  "function executeFromPQC(address pqcSender, uint256 value)"
];

const chainId = 1337n;
const pqNonce = 1n;
const to = "0x6fDfeb70f1b4D35A7E11A2687B7bAf367cDeB7aA";
const value = 0n;
const gasLimit = 800000n;
const gasPrice = 0n;
const pqAlgorithm = "DEMO-ED25519";

const keypair = generateDemoKeypair();
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
const pqSignature = signDigestDemo(txDigest, keypair.privateKeyPem);
const signatureValid = verifyDigestDemo(txDigest, pqSignature, keypair.publicKey);

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

console.log("canonicalTxBytes:", bytesToHex(canonicalTxBytes));
console.log("txDigest:", txDigest);
console.log("signatureValid:", signatureValid);
console.log("rawPqcTransaction:");
console.log(JSON.stringify(rawPqcTransaction, null, 2));
