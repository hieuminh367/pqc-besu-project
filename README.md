# PQC Besu Project

Post-Quantum Transaction and Consensus Architecture for Hyperledger Besu.

This repository contains the implemented application-layer project code for:

```text
Plan A: PQC Gateway PoC on a real Besu QBFT private network
Plan B1: Besu entry-layer PQC validation through custom RPC
```

## 1. Current Status

```text
[OK] Plan A core implementation completed.
[OK] Plan A frontend/backend/gateway demo completed.
[OK] Real ML-DSA-65 signing and verification completed.
[OK] Besu QBFT private network used as blockchain execution layer.
[OK] Plan B1.0 custom Besu RPC added.
[OK] Plan B1.1 Besu-side ML-DSA-65 verification completed.
[NOT YET] Plan B2 native PQC txpool/account/block path.
[NOT YET] Plan B3 PQC-QBFT consensus signatures.
```

## 2. Repository Layout

```text
app/
├── backend/              # Backend API, direct ABI calldata builder, direct ML-DSA raw PQC tx builder
├── frontend/             # React + Tailwind dashboard
├── contracts/            # BusinessContract and Hardhat scripts
├── pqc-core/             # Canonical encoder, txDigest, sender derivation, ML-DSA signing scripts
├── pqc-gateway/          # Plan A PQC Gateway verifier and relayer
├── network/              # Local Besu QBFT network config
├── scripts/              # Demo runner scripts
├── docs/                 # Project documentation and progress logs
└── results/              # Receipts, logs, evidence
```

The Besu source fork is kept outside this app repository:

```text
~/pqc-besu-project/besu-fork
```

Besu fork branch for Plan B:

```text
plan-b1-pqc-rpc
```

## 3. Plan A Architecture

```text
Frontend Dashboard
    |
    v
Backend API
    |
    | builds ABI calldata
    | builds raw PQC transaction
    | signs txDigest with ML-DSA-65
    v
PQC Gateway
    |
    | verifies ML-DSA-65 signature
    | derives PQC sender from pqPublicKey
    | checks pqNonce
    | rejects invalid/tampered/replayed tx
    v
Gateway Relayer
    |
    v
Besu QBFT Private Network
    |
    v
BusinessContract
    |
    v
Receipt / Event / State Update
```

Plan A claim:

Plan A demonstrates pre-chain ML-DSA-65 transaction verification through a PQC Gateway in front of a real Besu QBFT private network.

Plan A does not claim native Besu transaction validation.

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

## 5. Important Non-Claims

```text
[NO] Besu native transaction validation fully uses ML-DSA.
[NO] Besu txpool accepts native PQC transaction type.
[NO] EVM msg.sender is natively derived from pqPublicKey.
[NO] QBFT consensus messages are signed with ML-DSA.
[NO] Gateway alone makes Besu fully quantum-safe at protocol level.
```

These are Plan B2 and Plan B3 targets.

## 6. Main Demo Services

Local endpoints:

```text
Besu RPC:     http://127.0.0.1:8545
PQC Gateway:  http://127.0.0.1:3001
Backend API:  http://127.0.0.1:4000
Frontend UI:  http://127.0.0.1:5173
```

## 7. Environment

Create local `app/.env` from `.env.example`:

```text
cp .env.example .env
```

Required local variables:

```text
BESU_RPC_URL=http://127.0.0.1:8545
CHAIN_ID=1337
BUSINESS_CONTRACT_ADDRESS=0x...
TRUSTED_GATEWAY_RELAYER=0x...
RELAYER_PRIVATE_KEY=0x...
GATEWAY_PORT=3001
BACKEND_PORT=4000
GATEWAY_URL=http://127.0.0.1:3001
```

Do not commit `.env`.

## 8. Run Plan A Demo

Start services in separate terminals.

Terminal 1: Besu QBFT network

Use the Besu fork binary from:

```text
~/pqc-besu-project/besu-fork
```

Start the four QBFT validators as described in:

```text
docs/runbook-plan-a-b1.md
```

Terminal 2: PQC Gateway

```text
cd ~/pqc-besu-project/app
./scripts/run-gateway.sh
```

Terminal 3: Backend

```text
cd ~/pqc-besu-project/app/backend
npm run dev
```

Terminal 4: Frontend

```text
cd ~/pqc-besu-project/app/frontend
npm run dev
```

Open:

```text
http://127.0.0.1:5173
```

## 9. Run CLI Demo Scripts

```text
cd ~/pqc-besu-project/app

./scripts/check-besu-rpc.sh
./scripts/send-valid-mldsa-tx.sh
./scripts/send-invalid-signature.sh
./scripts/send-tampered-calldata.sh
```

## 10. Run Plan B1 Besu RPC Tests

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

## 11. Evidence

Important evidence files:

```text
docs/completed-summary.md
docs/plan-b1-progress.md
results/demo-logs/
results/receipts/plan-a-valid-mldsa-receipt.json
```

## 12. Next Target

Next implementation target:

```text
Plan B2: Native PQC transaction / account / txpool / block validation path.
```

Plan B2 should move beyond entry-layer RPC verification and integrate PQC validation into the native transaction lifecycle.
