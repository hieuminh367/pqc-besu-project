import test from "node:test";
import assert from "node:assert/strict";
import { generateMldsaKeypair, verifyDigestMldsa } from "../../pqc-core/src/mldsa.js";
import { buildExecuteNativePqcCall } from "../src/contracts/native-pqc-contract.js";
import {
  buildNativePqcTransaction,
  resolveNativeNonceSelection
} from "../src/native-pqc-service.js";

test("buildNativePqcTransaction uses ABI wrapper calldata and produces a signed native PQC tx", () => {
  const contractAddress = "0x6fDfeb70f1b4D35A7E11A2687B7bAf367cDeB7aA";
  const contractValue = 7n;
  const keypair = generateMldsaKeypair();

  const call = buildExecuteNativePqcCall(contractAddress, contractValue);
  const built = buildNativePqcTransaction({
    chainId: 1337n,
    accountNonce: 0n,
    gasPrice: 1000n,
    gasLimit: 800000n,
    contractAddress,
    contractValue,
    keypair,
  });

  assert.equal(call.functionName, "executeNativePQC(uint256)");
  assert.equal(built.contractCall.data, call.data);
  assert.equal(built.rawPqcTransaction.data, call.data);
  assert.equal(built.rawPqcTransaction.to, contractAddress);
  assert.equal(built.rawPqcTransaction.sender, built.pqcSender);
  assert.equal(built.signatureValid, true);
  assert.equal(
    verifyDigestMldsa(
      built.txDigest,
      built.rawPqcTransaction.pqSignature,
      built.rawPqcTransaction.pqPublicKey
    ),
    true
  );
  assert.match(built.rawNativePqcTransaction, /^0x05/);
});

test("resolveNativeNonceSelection uses the pending account nonce in auto mode", () => {
  const resolved = resolveNativeNonceSelection({
    requestedPqNonce: "auto",
    pendingAccountNonce: 3n
  });

  assert.equal(resolved.nonceMode, "auto");
  assert.equal(resolved.accountNonce, 3n);
  assert.equal(resolved.pqNonce, 4n);
});

test("resolveNativeNonceSelection converts a manual pqNonce into the matching account nonce", () => {
  const resolved = resolveNativeNonceSelection({
    requestedPqNonce: "9",
    pendingAccountNonce: 3n
  });

  assert.equal(resolved.nonceMode, "manual");
  assert.equal(resolved.accountNonce, 8n);
  assert.equal(resolved.pqNonce, 9n);
});

test("resolveNativeNonceSelection rejects pqNonce values below one", () => {
  assert.throws(
    () =>
      resolveNativeNonceSelection({
        requestedPqNonce: "0",
        pendingAccountNonce: 0n
      }),
    /PQ_NONCE must be >= 1/
  );
});
