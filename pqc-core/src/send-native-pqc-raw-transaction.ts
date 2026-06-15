import {
  Interface,
  encodeRlp,
  hexlify,
  toUtf8Bytes,
  JsonRpcProvider,
  Wallet
} from "ethers";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { derivePqcSenderAddress } from "./address.js";
import { bytesToHex, encodeCanonicalTx } from "./canonical-encoder.js";
import { computeTxDigest } from "./tx-digest.js";
import {
  generateMldsaKeypair,
  signDigestMldsa,
  verifyDigestMldsa
} from "./mldsa.js";

const nativePqcAbi = ["function executeNativePQC(uint256 value)"];

const BESU_RPC_URL = process.env.BESU_RPC_URL ?? "http://127.0.0.1:8545";
const NATIVE_PQC_CONTRACT_ADDRESS = process.env.NATIVE_PQC_CONTRACT_ADDRESS;

if (!NATIVE_PQC_CONTRACT_ADDRESS) {
  throw new Error("NATIVE_PQC_CONTRACT_ADDRESS is missing");
}

function readRootEnv(key: string): string | undefined {
  const envPath = resolve(process.cwd(), "../.env");
  if (!existsSync(envPath)) return undefined;

  const content = readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;

    const k = trimmed.slice(0, idx).trim();
    const v = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    if (k === key) return v;
  }

  return undefined;
}

function quantityToRlp(value: bigint): string {
  if (value === 0n) return "0x";
  let hex = value.toString(16);
  if (hex.length % 2 !== 0) hex = "0" + hex;
  return "0x" + hex;
}

const provider = new JsonRpcProvider(BESU_RPC_URL);

const chainId = 1337n;
const pqNonce = BigInt(process.env.PQ_NONCE ?? "1");
const accountNonce = pqNonce - 1n;

if (accountNonce < 0n) {
  throw new Error("PQ_NONCE must be >= 1");
}

const feeData = await provider.getFeeData();
const nodeGasPrice = feeData.gasPrice ?? 0n;

// Clean demo policy: use non-zero gas price by default.
// This avoids txpool/block selector edge cases with zero-price custom typed txs.
const gasPrice = process.env.GAS_PRICE
  ? BigInt(process.env.GAS_PRICE)
  : nodeGasPrice > 0n
    ? nodeGasPrice
    : 1000n;

const to = NATIVE_PQC_CONTRACT_ADDRESS;
const value = 0n;
const gasLimit = 800000n;
const pqAlgorithm = "ML-DSA-65";
const contractValue = BigInt(process.env.CONTRACT_VALUE ?? "7");

const keypair = generateMldsaKeypair();
const sender = derivePqcSenderAddress(keypair.publicKey);

const relayerPrivateKey =
  process.env.RELAYER_PRIVATE_KEY ?? readRootEnv("RELAYER_PRIVATE_KEY");

if (relayerPrivateKey) {
  const wallet = new Wallet(relayerPrivateKey, provider);
  const currentBalance = await provider.getBalance(sender);
  const requiredBalance = gasLimit * gasPrice + 1_000_000_000_000n;

  if (currentBalance < requiredBalance) {
    console.log("Funding PQC sender before native tx...");
    console.log("Relayer:", wallet.address);
    console.log("PQC sender:", sender);
    console.log("Current PQC sender balance:", currentBalance.toString());
    console.log("Funding amount:", requiredBalance.toString());

    const fundingTx = await wallet.sendTransaction({
      to: sender,
      value: requiredBalance,
      gasPrice
    });

    console.log("Funding tx:", fundingTx.hash);
    await fundingTx.wait();
    console.log("Funding mined");
  }
} else {
  console.log("[!] RELAYER_PRIVATE_KEY not found; sender funding skipped");
}

const iface = new Interface(nativePqcAbi);
const calldata = iface.encodeFunctionData("executeNativePQC", [contractValue]);

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
console.log("to:", to);
console.log("contractCall:", "executeNativePQC(uint256)");
console.log("contractValue:", contractValue.toString());
console.log("gasPrice:", gasPrice.toString());
console.log("gasLimit:", gasLimit.toString());
console.log("pqPublicKeyBytes:", (keypair.publicKey.length - 2) / 2);
console.log("pqSignatureBytes:", (pqSignature.length - 2) / 2);
console.log("canonicalTxBytes:", bytesToHex(canonicalTxBytes));
console.log("txDigest:", txDigest);

if (process.env.DUMP_RAW_TX === "1") {
  console.log("rawNativePqcTransaction:", rawNativePqcTransaction);
} else {
  console.log("rawNativePqcTransactionBytes:", (rawNativePqcTransaction.length - 2) / 2);
}

console.log("Submitting to Besu RPC:", BESU_RPC_URL);
console.log("Method: eth_sendRawTransaction");

const response = await fetch(BESU_RPC_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
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
