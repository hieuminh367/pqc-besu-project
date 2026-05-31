import { concat, getBytes, keccak256, toUtf8Bytes } from "ethers";

const DOMAIN_SEPARATOR = "PQC_BESU_TX_V1";

export function computeTxDigest(canonicalTxBytes: Uint8Array): string {
  return keccak256(
    concat([
      toUtf8Bytes(DOMAIN_SEPARATOR),
      canonicalTxBytes
    ])
  );
}
