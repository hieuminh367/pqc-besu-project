# Plan B1 Progress - Besu Entry-Layer PQC Validation

## 1. Goal

Plan B1 transitions PQC verification from the legacy relayer/gateway PoC toward Besu-side entry processing.

The target RPC method is:

```text
eth_sendRawPqcTransaction
```

This method receives a raw PQC transaction object and performs Besu-side entry-layer validation.

## 2. Implemented in Besu Fork

The Besu fork has been modified on branch:

```text
plan-b1-pqc-rpc
```

Implemented files:

```text
ethereum/api/src/main/java/org/hyperledger/besu/ethereum/api/jsonrpc/RpcMethod.java
ethereum/api/src/main/java/org/hyperledger/besu/ethereum/api/jsonrpc/internal/methods/EthSendRawPqcTransaction.java
ethereum/api/src/main/java/org/hyperledger/besu/ethereum/api/jsonrpc/internal/pqc/MldsaVerifier.java
ethereum/api/src/main/java/org/hyperledger/besu/ethereum/api/jsonrpc/methods/EthJsonRpcMethods.java
```

Completed:

```text
[OK] Added eth_sendRawPqcTransaction RPC enum.
[OK] Added EthSendRawPqcTransaction RPC method.
[OK] Registered RPC method in EthJsonRpcMethods.
[OK] Added Besu-side ML-DSA-65 verifier.
```

## 3. B1.0: Parse, Digest, Sender Derivation

B1.0 implemented:

```text
[OK] Besu receives raw PQC transaction object.
[OK] Besu parses transaction fields.
[OK] Besu validates required fields.
[OK] Besu recomputes canonicalTxBytes.
[OK] Besu recomputes txDigest.
[OK] Besu derives sender from pqPublicKey.
[OK] Besu checks derived sender against provided sender.
```

Evidence:

```text
Local txDigest:
0xe707242a1f9d595dd5260f00dfcdee06f7d9cd203c8bb236890c1d7b8d6f4f57

Besu txDigest:
0xe707242a1f9d595dd5260f00dfcdee06f7d9cd203c8bb236890c1d7b8d6f4f57

Local sender:
0x5dba999076ad86e83ceeb8a554d2295fd3144663

Besu derivedSender:
0x5dba999076ad86e83ceeb8a554d2295fd3144663
```

Conclusion:

The Java Besu implementation and the TypeScript pqc-core implementation compute the same canonical transaction digest and sender address.

## 4. B1.1: Besu-side ML-DSA Verification

B1.1 implemented real Java-side ML-DSA-65 verification using Bouncy Castle.

Completed:

```text
[OK] Besu verifies ML-DSA-65 signatures inside eth_sendRawPqcTransaction.
[OK] Valid ML-DSA-65 signatures are accepted.
[OK] Invalid ML-DSA-65 signatures are rejected.
[OK] Verification happens inside the Besu process.
```

Valid signature evidence:

```text
Local signatureValid: true
Besu accepted: true
signatureVerification: verified-by-bouncycastle-mldsa65
signatureValid: true
besuSideMldsaVerification: true
```

Invalid signature evidence:

```text
Local valid after tamper: false
Besu accepted: false
stage: mldsa-verification
reason: invalid ML-DSA-65 signature
signatureValid: false
```

## 5. Current B1 Status

Current completed B1 capabilities:

```text
[OK] Custom Besu RPC method exists.
[OK] Besu accepts raw PQC transaction object.
[OK] Besu parses raw PQC transaction fields.
[OK] Besu computes canonicalTxBytes.
[OK] Besu computes txDigest.
[OK] Besu derives PQC sender from pqPublicKey.
[OK] Besu verifies ML-DSA-65 signature.
[OK] Besu rejects invalid ML-DSA-65 signature.
```

Plan B1 claim:

```text
Plan B1 implements Besu entry-layer PQC validation through a custom eth_sendRawPqcTransaction RPC method.
```

## 6. Current Limitations

The following items are not implemented yet:

```text
[ ] Native PQC transaction type.
[ ] PQC-aware txpool.
[ ] Native account nonce/gas/balance validation for PQC sender.
[ ] Block inclusion of native PQC transactions.
[ ] Block import validation for PQC transactions.
[ ] EVM msg.sender as PQC-derived sender in native transaction path.
[ ] PQC-QBFT consensus signatures.
```

These are Plan B2 and Plan B3 targets.

## 7. Next Target

The next target is Plan B2:

```text
Native PQC transaction / account / txpool / block validation path.
```

Plan B2 should move beyond entry-layer RPC verification and integrate PQC validation into transaction lifecycle and block import rules.
