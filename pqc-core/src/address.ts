import { getBytes, keccak256 } from "ethers";

export function derivePqcSenderAddress(pqPublicKey: string): string {
  const pubKeyBytes = getBytes(pqPublicKey);
  const hash = getBytes(keccak256(pubKeyBytes));
  const last20 = hash.slice(hash.length - 20);
  return "0x" + Buffer.from(last20).toString("hex");
}
