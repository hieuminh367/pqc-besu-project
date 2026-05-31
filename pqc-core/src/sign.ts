import crypto from "node:crypto";

export type DemoKeypair = {
  publicKey: string;
  privateKeyPem: string;
};

export function generateDemoKeypair(): DemoKeypair {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");

  const publicKeyDer = publicKey.export({
    type: "spki",
    format: "der"
  });

  const privateKeyPem = privateKey.export({
    type: "pkcs8",
    format: "pem"
  }).toString();

  return {
    publicKey: "0x" + Buffer.from(publicKeyDer).toString("hex"),
    privateKeyPem
  };
}

export function signDigestDemo(txDigest: string, privateKeyPem: string): string {
  const digestBytes = Buffer.from(txDigest.slice(2), "hex");
  const signature = crypto.sign(null, digestBytes, privateKeyPem);
  return "0x" + signature.toString("hex");
}
