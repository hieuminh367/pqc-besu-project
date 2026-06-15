import test from "node:test";
import assert from "node:assert/strict";
import { buildNativeTransactionDump } from "../src/utils/nativeTransactionDump.ts";
import type { NativePqcTransactionResponse } from "../src/api/client.ts";

test("buildNativeTransactionDump omits gateway metadata from the dump network section", () => {
  const tx = {
    ok: true,
    mode: "plan-b-native",
    nonceMode: "auto",
    abiFunction: "executeNativePQC(uint256)",
    rpcMethod: "eth_sendRawTransaction",
    nativeTransactionType: "0x05",
    nativePqcContractAddress: "0x6fDfeb70f1b4D35A7E11A2687B7bAf367cDeB7aA",
    pqNonce: "1",
    accountNonce: "0",
    pendingAccountNonce: "0",
    contractValue: "7",
    txHash: "0xtx",
    pqcSender: "0xsender",
    txDigest: "0xdigest",
    localVerification: {
      txDigest: "0xdigest",
      signatureValid: true,
      pqPublicKeyBytes: 1952,
      pqSignatureBytes: 3309
    },
    rawPqcTransaction: {
      type: "0x05",
      chainId: "1337",
      pqNonce: "1",
      to: "0x6fDfeb70f1b4D35A7E11A2687B7bAf367cDeB7aA",
      value: "0",
      gasLimit: "800000",
      gasPrice: "1000",
      data: "0x1234",
      pqAlgorithm: "ML-DSA-65",
      pqPublicKey: "0xabc",
      pqSignature: "0xdef",
      sender: "0xsender"
    },
    receipt: {
      status: "0x1",
      blockNumber: "0x9",
      logs: [
        {
          data: "0x00000000000000000000000000000000000000000000000000000000000000070000000000000000000000000000000000000000000000000000000000000007"
        }
      ]
    },
    latestBlock: "0x9",
    stdout: "",
    stderr: ""
  } satisfies NativePqcTransactionResponse;

  const dump = buildNativeTransactionDump(tx, {
    backendUrl: "/api",
    counterAfter: "7",
    health: {
      chainId: "1337",
      besuRpcUrl: "http://127.0.0.1:8545",
      nativePqcContractAddress: "0x6fDfeb70f1b4D35A7E11A2687B7bAf367cDeB7aA"
    }
  });

  assert.equal("gateway" in dump.network, false);
  assert.equal(dump.stateReadback.counterAfter, "7");
});
