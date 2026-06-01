# Plan B2 Progress - Native PQC Transaction Path

## 1. Goal

Plan B2 moves beyond the external PQC Gateway and beyond the custom B1 RPC verifier.

The goal is to introduce a native PQC transaction path into the Besu fork.

---

## 2. Completed B2 Work

### B2.0 - Besu-side Verified Txpool Submission

Implemented:

```text
[OK] eth_sendRawPqcTransaction verifies ML-DSA-65 inside Besu.
[OK] Besu derives PQC sender from pqPublicKey.
[OK] Besu builds an internal Transaction object.
[OK] Besu submits the verified transaction to local txpool.
[OK] txPoolAccepted = true.
```

Evidence:

```text
stage: b2-verified-pqc-txpool-submission
signatureVerification: verified-by-bouncycastle-mldsa65
signatureValid: true
besuSideMldsaVerification: true
besuSideTxPoolSubmission: true
txPoolAccepted: true
```

Finding:

Local sender override is not sufficient for full native P2P/block propagation.
The normal FRONTIER transaction serialization does not preserve pqPublicKey,
pqSignature, pqAlgorithm, or PQC sender metadata.

Conclusion:

B2.0 proves Besu-side verified local txpool submission, but not full native
P2P/block import validation.

## 3. B2.2 Native PQC Typed Transaction

A native PQC transaction type has been added:

```text
TransactionType.PQC / 0x05
```

Raw transaction format:

```text
0x05 || RLP([
  chainId,
  accountNonce,
  gasPrice,
  gasLimit,
  to,
  value,
  payload,
  pqAlgorithm,
  pqPublicKey,
  pqSignature
])
```

Implemented in Besu fork:

```text
[OK] TransactionType.PQC added.
[OK] PqcTransactionEncoder added.
[OK] PqcTransactionDecoder added.
[OK] Transaction carries pqPublicKey.
[OK] Transaction carries pqSignature.
[OK] Transaction carries pqAlgorithm.
[OK] PQC sender derivation utility added.
[OK] ML-DSA-65 verifier utility added.
[OK] MainnetTransactionValidator validates native PQC signatures.
```

## 4. Valid Native PQC Typed Transaction Test

Method:

```text
eth_sendRawTransaction
```

Observed local result:

```text
Native transaction type: 0x05
Algorithm: ML-DSA-65
Local signatureValid: true
pqPublicKeyBytes: 1952
pqSignatureBytes: 3309
```

Observed Besu result:

```text
Besu returned transaction hash:
0x83fa7a75e625c805b25551a594313d4e62a4a0f38517fa68780348081a4408c3
```

Conclusion:

Besu accepts a native typed PQC transaction through eth_sendRawTransaction.
This confirms that TransactionType.PQC / 0x05 is recognized and decoded.

## 5. Invalid Native PQC Signature Test

Method:

```text
eth_sendRawTransaction
```

Observed local result:

```text
Native transaction type: 0x05
Algorithm: ML-DSA-65
Local valid after tamper: false
pqPublicKeyBytes: 1952
pqSignatureBytes: 3309
```

Observed Besu result:

```text
JSON-RPC error code: -32002
JSON-RPC error message: Invalid signature
```

Conclusion:

Besu rejects invalid native PQC typed transactions.
This confirms that native validation verifies ML-DSA-65 signatures for
TransactionType.PQC.

## 6. Current B2 Claim

The project can currently claim:

Plan B2 implements an experimental native PQC typed transaction path in Besu.
Besu recognizes TransactionType.PQC / 0x05, decodes PQC metadata, verifies
ML-DSA-65 signatures in native transaction validation, accepts valid native PQC
typed transactions, and rejects invalid native PQC typed signatures.

## 7. Current Limitations

Not completed yet:

```text
[ ] Full P2P propagation verification for native PQC typed transactions.
[ ] Full block inclusion verification for native PQC typed transactions.
[ ] Block import validation evidence across multiple Besu nodes.
[ ] EVM msg.sender contract-state evidence for native PQC sender.
[ ] PQC-QBFT consensus signatures.
```

## 8. Next Target

Next target:

```text
B2.3 - Native PQC transaction block inclusion and receipt evidence.
```

This should prove that a valid TransactionType.PQC transaction can be included
in a QBFT block and that invalid PQC typed transactions are rejected by importing
nodes.
