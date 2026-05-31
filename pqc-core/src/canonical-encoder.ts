import { getBytes, zeroPadValue } from "ethers";

export type CanonicalTxFields = {
  type: string;
  chainId: bigint;
  nonce: bigint;
  to: string;
  value: bigint;
  gasLimit: bigint;
  gasPrice: bigint;
  data: string;
  pqAlgorithm: string;
};

function u32be(n: number): Uint8Array {
  const out = new Uint8Array(4);
  out[0] = (n >>> 24) & 0xff;
  out[1] = (n >>> 16) & 0xff;
  out[2] = (n >>> 8) & 0xff;
  out[3] = n & 0xff;
  return out;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

function encodeBytes(bytes: Uint8Array): Uint8Array {
  return concat([u32be(bytes.length), bytes]);
}

function encodeString(value: string): Uint8Array {
  return encodeBytes(new TextEncoder().encode(value));
}

function bigintToMinimalBytes(value: bigint): Uint8Array {
  if (value < 0n) {
    throw new Error("negative integer is not allowed");
  }
  if (value === 0n) {
    return new Uint8Array([]);
  }

  let hex = value.toString(16);
  if (hex.length % 2 !== 0) {
    hex = "0" + hex;
  }

  return getBytes("0x" + hex);
}

function encodeUint(value: bigint): Uint8Array {
  return encodeBytes(bigintToMinimalBytes(value));
}

function encodeAddress(address: string): Uint8Array {
  const bytes = getBytes(zeroPadValue(address, 20));
  if (bytes.length !== 20) {
    throw new Error("address must be 20 bytes");
  }
  return encodeBytes(bytes);
}

export function encodeCanonicalTx(fields: CanonicalTxFields): Uint8Array {
  return concat([
    encodeString(fields.type),
    encodeUint(fields.chainId),
    encodeUint(fields.nonce),
    encodeAddress(fields.to),
    encodeUint(fields.value),
    encodeUint(fields.gasLimit),
    encodeUint(fields.gasPrice),
    encodeBytes(getBytes(fields.data)),
    encodeString(fields.pqAlgorithm)
  ]);
}

export function bytesToHex(bytes: Uint8Array): string {
  return "0x" + Buffer.from(bytes).toString("hex");
}
