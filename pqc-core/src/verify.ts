import crypto from "node:crypto";

export function verifyDigestDemo(
  txDigest: string,
  pqSignature: string,
  pqPublicKey: string
): boolean {
  const digestBytes = Buffer.from(txDigest.slice(2), "hex");
  const sigBytes = Buffer.from(pqSignature.slice(2), "hex");
  const pubDer = Buffer.from(pqPublicKey.slice(2), "hex");

  const publicKey = crypto.createPublicKey({
    key: pubDer,
    type: "spki",
    format: "der"
  });

  return crypto.verify(null, digestBytes, publicKey, sigBytes);
}
