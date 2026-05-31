import { ml_dsa65 } from "@noble/post-quantum/ml-dsa.js";
import { randomBytes } from "@noble/post-quantum/utils.js";

export type MldsaKeypair = {
  publicKey: string;
  secretKey: string;
};

function bytesToHex(bytes: Uint8Array): string {
  return "0x" + Buffer.from(bytes).toString("hex");
}

function hexToBytes(hex: string): Uint8Array {
  if (!hex.startsWith("0x")) {
    throw new Error("hex string must start with 0x");
  }
  return new Uint8Array(Buffer.from(hex.slice(2), "hex"));
}

export function generateMldsaKeypair(): MldsaKeypair {
  const seed = randomBytes(32);
  const keys = ml_dsa65.keygen(seed);

  return {
    publicKey: bytesToHex(keys.publicKey),
    secretKey: bytesToHex(keys.secretKey)
  };
}

export function signDigestMldsa(txDigest: string, secretKey: string): string {
  const digestBytes = hexToBytes(txDigest);
  const sig = ml_dsa65.sign(digestBytes, hexToBytes(secretKey));
  return bytesToHex(sig);
}

export function verifyDigestMldsa(
  txDigest: string,
  pqSignature: string,
  pqPublicKey: string
): boolean {
  const digestBytes = hexToBytes(txDigest);
  return ml_dsa65.verify(
    hexToBytes(pqSignature),
    digestBytes,
    hexToBytes(pqPublicKey)
  );
}
