# PQC Besu Project

Post-Quantum Transaction and Consensus Architecture for Hyperledger Besu.

This repository contains the implemented application-layer project code for:

```text
Plan B1: Besu entry-layer PQC validation through custom RPC
Plan B2: Native PQC typed transaction path in Besu with QBFT block execution
```

## 1. Current Status

```text
[OK] Real ML-DSA-65 signing and verification completed.
[OK] Besu QBFT private network used as blockchain execution layer.
[OK] Plan B1.0 custom Besu RPC added.
[OK] Plan B1.1 Besu-side ML-DSA-65 verification completed.
[OK] Plan B2 native PQC typed transaction path completed at demo level.
[OK] Frontend -> backend -> ABI wrapper -> native tx 0x05 -> Besu -> receipt flow stabilized.
[LEGACY] Relayer/gateway path archived in docs/legacy for reference only.
[NOT YET] Production-grade PQC txpool policy / long-running P2P stress test.
[NOT YET] Plan B3 PQC-QBFT consensus signatures.
```

## 2. Repository Layout

```text
app/
├── backend/              # Backend API (Plan B native endpoint + explorer views)
├── frontend/             # React + Tailwind dashboard
├── contracts/            # BusinessContract and Hardhat scripts
├── pqc-core/             # Canonical encoder, txDigest, sender derivation, ML-DSA signing scripts
├── docs/legacy/          # Legacy relayer-path references and old gateway proofs (for history only)
├── network/              # Local Besu QBFT network config
├── scripts/              # Demo runner scripts
├── docs/                 # Project documentation and progress logs
└── results/              # Receipts, logs, evidence
```

The Besu source fork is kept outside this app repository:

```text
~/pqc-besu-project/besu-fork
```

Besu fork branch for current Plan B native work:

```text
plan-b2-native-pqc-tx
```

## 3. Legacy references (for history)

- `docs/legacy/` stores the relayer-gateway proof chain and runbook.
- `results/legacy/` stores legacy Plan A evidence logs/receipts.

## 4. Plan B1 Architecture

```text
pqc-core script / client
    |
    | raw PQC transaction object
    v
Besu JSON-RPC
    |
    | eth_sendRawPqcTransaction
    v
Besu-side PQC parser
    |
    | canonicalTxBytes
    | txDigest
    | sender derivation
    | ML-DSA-65 verification
    v
Besu RPC result
```

Plan B1 claim:

Plan B1 implements Besu entry-layer PQC validation through a custom eth_sendRawPqcTransaction RPC method.

Plan B1 does not yet implement native txpool, account nonce/gas/balance, block import validation, or PQC-QBFT consensus.

## 5. Plan B2 Architecture

```text
Frontend Dashboard
    |
    v
Backend Native Endpoint
    |
    | builds ABI calldata from deployed contract ABI
    | resolves pqNonce = auto from Besu pending account nonce
    | signs txDigest with ML-DSA-65
    | serializes native PQC transaction type 0x05
    v
Besu JSON-RPC
    |
    | eth_sendRawTransaction
    v
Besu Native PQC Validation
    |
    | decodes TransactionType.PQC
    | derives sender from pqPublicKey
    | verifies ML-DSA-65 signature
    | includes transaction in QBFT block
    v
Receipt / Event / State Readback
```

Plan B2 claim:

Plan B2 implements an experimental native PQC transaction path in Besu: ABI-driven calldata, native typed transaction `0x05`, Besu-side ML-DSA-65 validation, QBFT block inclusion, and EVM execution with PQC-derived `msg.sender`.

## 6. Current Limits

```text
[NO] Production-grade PQC txpool policy is finalized.
[NO] Long-running multi-node P2P stress evidence is completed.
[NO] QBFT consensus messages are signed with ML-DSA.
[NO] Gateway alone makes Besu fully quantum-safe at protocol level.
```

These are the remaining B2 hardening items and the Plan B3 target.

## 7. Main Demo Services (Plan B Submission Focus)

Local endpoints:

```text
Besu RPC:     http://127.0.0.1:8545
Backend API:  http://127.0.0.1:4000
Frontend UI:  http://127.0.0.1:5173
```

## 8. Environment

Create local `app/.env` from `.env.example`:

```text
cp .env.example .env
```

Required local variables for Plan B native run:

```text
BESU_RPC_URL=http://127.0.0.1:8545
CHAIN_ID=1337
BUSINESS_CONTRACT_ADDRESS=0x...
RELAYER_PRIVATE_KEY=0x...
BACKEND_PORT=4000
NATIVE_PQC_CONTRACT_ADDRESS=0x...
```

Do not commit `.env`.

## 9. Run Plan B Native Demo

Start services in separate terminals.

Terminal 1: Besu QBFT network

Use the Besu fork binary from:

```text
~/pqc-besu-project/besu-fork
```

Start the QBFT validators for your local network.

Terminal 2: Backend

```text
cd ~/pqc-besu-project/app/backend
npm run dev
```

Terminal 3: Frontend

```text
cd ~/pqc-besu-project/app/frontend
npm run dev
```

Open:

```text
http://127.0.0.1:5173
```

## 10. CLI Scripts

```text
cd ~/pqc-besu-project/app
./scripts/check-besu-rpc.sh
./scripts/send-valid-mldsa-tx.sh
```

These scripts are for active Plan B verification and local checks.

## 11. Run Plan B1 Besu RPC Tests

Valid ML-DSA transaction to Besu RPC:

```text
cd ~/pqc-besu-project/app/pqc-core
npm run send:mldsa:besu-rpc
```

Invalid ML-DSA signature to Besu RPC:

```text
cd ~/pqc-besu-project/app/pqc-core
npm run send:invalid-mldsa:besu-rpc
```

Expected result for valid case:

```text
accepted: true
signatureVerification: verified-by-bouncycastle-mldsa65
signatureValid: true
besuSideMldsaVerification: true
```

Expected result for invalid case:

```text
accepted: false
stage: mldsa-verification
reason: invalid ML-DSA-65 signature
signatureValid: false
```

## 12. Run Plan B2 Native App Demo

Start the QBFT network, backend, and frontend as above, then open:

```text
http://127.0.0.1:5173
```

Use the native transaction card in the dashboard.

Expected demo flow:

```text
frontend
  -> POST /plan-b/native-buy
  -> backend ABI-encodes executeNativePQC(uint256)
  -> backend resolves pqNonce = auto from Besu pending account nonce
  -> backend signs native PQC tx type 0x05 with ML-DSA-65
  -> Besu eth_sendRawTransaction
  -> receipt status 0x1
```

Expected evidence on success:

```text
nativeTransactionType: 0x05
receipt.status: 0x1
txHash: 0x...
pqcSender: 0x...
```

## 13. Evidence

Important evidence files:

```text
docs/completed-summary.md
docs/plan-b1-progress.md
docs/plan-b2-progress.md
besu-native/README.md
results/demo-logs/plan-b2-native-pqc-block-execution-success.txt
results/demo-logs/plan-b2-native-pqc-typed-valid-test.txt
results/demo-logs/plan-b2-native-pqc-typed-invalid-signature-test.txt
```

## 14. Submission reading order

Nên đọc theo thứ tự sau để nộp đúng trọng tâm Plan B:

- [docs/completed-summary.md](/home/minhhieu/pqc-besu-project/app/docs/completed-summary.md)
- [docs/plan-b1-progress.md](/home/minhhieu/pqc-besu-project/app/docs/plan-b1-progress.md)
- [docs/plan-b2-progress.md](/home/minhhieu/pqc-besu-project/app/docs/plan-b2-progress.md)
- [docs/submission-checklist.md](/home/minhhieu/pqc-besu-project/app/docs/submission-checklist.md)
- [results/demo-logs/](/home/minhhieu/pqc-besu-project/app/results/demo-logs)
- [besu-native/README.md](/home/minhhieu/pqc-besu-project/app/besu-native/README.md)

## 15. Besu Native Fork

The native Besu Plan B implementation is maintained in a separate Besu fork repository:

```text
https://github.com/hieuminh367/pqc-besu-native-fork/tree/plan-b2-native-pqc-tx
```

This branch contains:

```text
[OK] eth_sendRawPqcTransaction
[OK] Besu-side ML-DSA-65 verification
[OK] TransactionType.PQC / 0x05
[OK] PQC transaction encoder/decoder
[OK] native PQC typed transaction validation
[OK] valid native PQC typed transaction accepted
[OK] invalid native PQC typed signature rejected
```

## 16. Next Target

Next implementation target:

```text
Plan B2: Native PQC transaction / account / txpool / block validation path.
```

Plan B2 should move beyond entry-layer RPC verification and integrate PQC validation into the native transaction lifecycle.
