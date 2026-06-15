# Plan B2 Progress - Native PQC Transaction Path

## 1. Goal

Plan B2 continues from Plan B1 and moves validation into Besu native typed-transaction processing.

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
[ ] Production-grade transaction pool policy for PQC transactions.
[ ] Full long-running P2P stress test.
[ ] PQC-QBFT consensus signatures.
```

## 8. Next Target

Next target:

```text
B3 - PQC-QBFT consensus signatures.
```

Before B3, the remaining optional hardening work is native txpool policy and
long-running P2P stress evidence for the B2 demo path.

---

## 9. B2.3 Native PQC Block Inclusion and EVM Execution

B2.3 completed native PQC typed transaction block inclusion and EVM execution.

Observed successful transaction:

```text
transactionHash:
0xda99ae44df03ef1d071a0c4b1a798a36c873b41aed1dad4662b6ef8804a78884

blockNumber:
0xfe

status:
0x1

type:
0x5

from:
0x04b01bb8ca5e290f1a53ee70a1cf53b224e2d51c

to:
0x6fdfeb70f1b4d35a7e11a2687b7baf367cdeb7aa

Observed contract event:

NativePQCActionExecuted

pqcSender:
0x04b01bb8ca5e290f1a53ee70a1cf53b224e2d51c

value:
7

counterAfter:
7

Conclusion:

[OK] Native PQC typed transaction is accepted through eth_sendRawTransaction.
[OK] TransactionType.PQC / 0x05 is decoded by Besu.
[OK] ML-DSA-65 signature is validated by Besu native validation.
[OK] Native PQC transaction is included in a QBFT block.
[OK] EVM execution succeeds.
[OK] Contract sees PQC-derived sender as msg.sender.
[OK] NativePQCActionExecuted event is emitted.

Updated B2 claim:

Plan B2 implements an experimental native PQC typed transaction path in Besu:
TransactionType.PQC / 0x05, PQC metadata serialization, ML-DSA-65 validation,
QBFT block inclusion, and EVM execution with PQC-derived msg.sender.

Remaining future work:

[ ] Production-grade transaction pool policy for PQC transactions.
[ ] Full long-running P2P stress test.
[ ] PQC-QBFT consensus signatures.

## 10. B2.4 Native App Flow Stabilization

The application-layer demo flow has been stabilized for repeated native submits.

Completed:

```text
[OK] Frontend sends native Plan B requests directly (legacy gateway-shaped adapter path kept only in docs/legacy).
[OK] Backend resolves pqNonce = auto from Besu pending account nonce for repeated native submits.
[OK] Backend serializes native TransactionType.PQC / 0x05 from ABI-generated calldata.
[OK] Frontend/backend test runners are available through npm test.
[OK] Native dashboard flow is aligned with: frontend -> backend -> ABI -> native PQC tx -> Besu -> receipt.
```
