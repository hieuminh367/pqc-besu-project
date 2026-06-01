# Completed Summary - PQC Besu Project

## 1. Current Project Status

The core implementation of **Plan A - PQC Gateway PoC** has been completed.

The project currently demonstrates a post-quantum transaction verification flow on top of a real Hyperledger Besu private QBFT network.

Current status:

```text
[OK] Plan A core implementation completed.
[OK] PQC Gateway verifies real ML-DSA-65 signatures.
[OK] Backend directly builds ABI calldata and raw PQC transactions.
[OK] Frontend dashboard can trigger and display demo transactions.
[OK] Besu QBFT network includes relayed transactions in blocks.
[OK] Smart contract execution, receipt, event, and state update are verified.
[NOT YET] Plan B native Besu transaction validation.
[NOT YET] PQC-QBFT consensus integration.
```

---

## 2. Project Structure

The project workspace is organized into two main directories:

```text
~/pqc-besu-project/
├── app/
└── besu-fork/
```

### app/

The `app/` directory contains the application-level implementation:

```text
contracts/
backend/
frontend/
pqc-core/
pqc-gateway/
network/
scripts/
docs/
results/
besu-native/
qbft-pqc-prototype/
```

This directory is used for Plan A implementation, demo scripts, evidence, frontend, backend, gateway, smart contracts, and documentation.

### besu-fork/

The `besu-fork/` directory contains the Hyperledger Besu source code.

Current Besu branch:

```text
pqc-native-upgrade
```

This branch is prepared for Plan B native Besu upgrade work.

Completed:

```text
[OK] Project workspace created.
[OK] Application code separated into app/.
[OK] Besu source separated into besu-fork/.
[OK] Besu native upgrade branch prepared.
```

---

## 3. Besu Source Build

Hyperledger Besu has been built successfully from source using Java 25.

Verified Besu version:

```text
besu/v26.5-develop-b77d00f/linux-x86_64/openjdk-java-25
```

Completed:

```text
[OK] Java 25 configured.
[OK] Besu source builds successfully.
[OK] Besu binary runs successfully.
[OK] Local Besu version verified.
```

---

## 4. Development Environment

The local development environment has been configured.

Completed:

```text
[OK] Java 25 configured for Besu.
[OK] Node.js 22 configured.
[OK] Hardhat configured.
[OK] TypeScript configured.
[OK] Ethers.js installed.
[OK] React frontend environment configured.
[OK] Tailwind CSS configured.
[OK] PQC Gateway server runs locally.
[OK] Backend API server runs locally.
[OK] Frontend dashboard runs locally.
```

---

## 5. Besu RPC Verification

A local Besu JSON-RPC endpoint has been started and verified.

RPC endpoint:

```text
http://127.0.0.1:8545
```

Verified method:

```text
web3_clientVersion
```

Successful result:

```text
besu/v26.5-develop-b77d00f/linux-x86_64/openjdk-java-25
```

Completed:

```text
[OK] Besu node starts locally.
[OK] JSON-RPC endpoint is reachable.
[OK] External tools can connect to Besu RPC.
```

---

## 6. QBFT Private Network

A local private Besu network using QBFT consensus has been generated and started.

Network information:

```text
Consensus: QBFT
Chain ID: 1337
RPC endpoint: http://127.0.0.1:8545
```

The QBFT network successfully produced blocks and included transactions.

Evidence:

```text
Block #75 was produced with 1 transaction.
The pending transaction count returned to 0.
The transaction used 49,279 gas.
```

Completed:

```text
[OK] Local QBFT network generated.
[OK] Validator nodes started.
[OK] QBFT block production works.
[OK] Transaction inclusion in QBFT block verified.
[OK] net_peerCount reached 0x3 during demo.
```

---

## 7. Smart Contract Deployment

`BusinessContract` has been deployed successfully to the Besu QBFT network.

Contract address:

```text
0x6fDfeb70f1b4D35A7E11A2687B7bAf367cDeB7aA
```

Trusted gateway relayer:

```text
0x2f1AD402D1F8421BBF044417F509bb3119d7a79d
```

The contract bytecode was verified on-chain using `eth_getCode`.

Completed:

```text
[OK] BusinessContract compiled.
[OK] BusinessContract deployed.
[OK] Contract bytecode exists on-chain.
[OK] Trusted gateway relayer configured in constructor.
```

---

## 8. Baseline Contract Execution

The deployed contract was tested through the trusted relayer model.

Test call:

```text
executeFromPQC(pqcSender, 7)
```

Test PQC sender:

```text
0x1111111111111111111111111111111111111111
```

Execution result:

```text
Relayer: 0x2f1AD402D1F8421BBF044417F509bb3119d7a79d
Tx hash: 0x6c8840bbaf8d34f5673762a8f9111a286b8a92b2b86ae795b8c5e1da08c416d1
Receipt status: 1
Block number: 75
Counter before: 0
Counter after: 7
```

Completed:

```text
[OK] Relayer submitted transaction to Besu.
[OK] Transaction was included in QBFT block #75.
[OK] Receipt status was successful.
[OK] BusinessContract executed successfully.
[OK] Contract state changed from 0 to 7.
[OK] Trusted relayer model works.
```

---

## 9. PQC Transaction Core

The `pqc-core` module has been implemented.

Completed:

```text
[OK] Canonical transaction encoder implemented.
[OK] Transaction digest generation implemented.
[OK] PQC sender derivation implemented.
[OK] Raw PQC transaction object generation implemented.
[OK] Transaction signing interface implemented.
[OK] Transaction verification interface implemented.
```

The implemented transaction pipeline is:

```text
canonical transaction fields
→ canonicalTxBytes
→ txDigest
→ pqSignature
→ pqPublicKey
→ sender derivation
→ rawPQCTransaction
```

Sender derivation rule:

```text
sender = last20Bytes(keccak256(pqPublicKey))
```

Transaction digest rule:

```text
txDigest = keccak256("PQC_BESU_TX_V1" || canonicalTxBytes)
```

---

## 10. Demo Signature Backend Clarification

A temporary Ed25519 backend was used earlier only to validate the transaction pipeline.

Important clarification:

```text
Ed25519 is not a post-quantum signature algorithm.
```

Current status:

```text
The temporary Ed25519 demo backend is not the final PQC implementation.
The real PQC signature backend is ML-DSA-65.
```

Completed:

```text
[OK] Demo signing interface tested.
[OK] Demo verification interface tested.
[OK] Interface replaced by real ML-DSA-65 for final Plan A demo.
```

---

## 11. Real ML-DSA-65 Integration

Real ML-DSA-65 signing and verification have been added.

Completed:

```text
[OK] ML-DSA-65 key generation works.
[OK] ML-DSA-65 signing works.
[OK] ML-DSA-65 verification works locally.
[OK] Raw PQC transaction can be signed with ML-DSA-65.
[OK] ML-DSA-65 public key is included in raw PQC transaction.
[OK] ML-DSA-65 signature is included in raw PQC transaction.
```

Observed ML-DSA evidence:

```text
Algorithm: ML-DSA-65
Local signatureValid: true
pqPublicKeyBytes: 1952
pqSignatureBytes: 3309
```

---

## 12. PQC Gateway

The PQC Gateway has been implemented and configured.

Gateway endpoint:

```text
http://127.0.0.1:3001
```

Gateway endpoints:

```text
GET  /health
POST /submit-pqc-tx
```

Completed:

```text
[OK] Gateway server runs locally.
[OK] Gateway reads config from app/.env.
[OK] Gateway verifies raw PQC transaction structure.
[OK] Gateway recomputes canonicalTxBytes.
[OK] Gateway recomputes txDigest.
[OK] Gateway derives sender from pqPublicKey.
[OK] Gateway verifies ML-DSA-65 signature.
[OK] Gateway checks pqNonce.
[OK] Gateway relays valid transactions to Besu.
```

---

## 13. Valid ML-DSA Gateway Transaction

A valid raw PQC transaction signed with real ML-DSA-65 was submitted through the PQC Gateway.

Observed result:

```text
Algorithm: ML-DSA-65
Local signatureValid: true
Sender: 0x1581bbb939c82f2d94f60675da2baf88ba0c104f
pqNonce: 1
pqPublicKeyBytes: 1952
pqSignatureBytes: 3309
txDigest: 0x6376fa43302c8cc957468cdc5389d2760260fa855264eeb1fc126ba2ef0fc359
```

Gateway response:

```text
accepted: true
signatureValid: true
pqNonceValid: true
derivedSender: 0x1581bbb939c82f2d94f60675da2baf88ba0c104f
receiptStatus: 1
blockNumber: 421
counterAfter: 7
```

Besu relay result:

```text
txHash: 0xff24b269d6a51d9ab6d48eba33bde2a096b4fdd7fd3ecb2193891746cd49b6c8
receiptStatus: 1
blockNumber: 421
counterAfter: 7
```

Completed:

```text
[OK] Valid ML-DSA-65 raw PQC transaction generated.
[OK] Gateway accepted valid ML-DSA-65 transaction.
[OK] Gateway verified ML-DSA-65 signature.
[OK] Gateway validated pqNonce.
[OK] Gateway relayed transaction to Besu.
[OK] Besu included transaction in QBFT block.
[OK] BusinessContract state update succeeded.
```

---

## 14. Invalid Signature Test

The PQC Gateway was tested with an invalid signature.

Test method:

```text
A valid transaction was generated first.
Then one byte of pqSignature was modified before submission.
```

Observed result:

```text
Local valid after tamper: false
Gateway HTTP status: 400
stage: signature-verification
reason: invalid signature
```

Completed:

```text
[OK] Gateway rejected invalid signature.
[OK] Invalid transaction was not relayed to Besu.
[OK] Signature verification failure was reported clearly.
```

---

## 15. Tampered Calldata Test

The PQC Gateway was tested with calldata modified after signing.

Test method:

```text
Original calldata: executeFromPQC(sender, 7)
Tampered calldata: executeFromPQC(sender, 8)
```

Observed result:

```text
Original signature valid: true
Signature valid after calldata tamper: false
Gateway HTTP status: 400
stage: signature-verification
reason: invalid signature
```

Digest evidence:

```text
Original txDigest: 0x8796d9a6b4f5e937bb420ed09f5ebcaacf86acb705935a950ebee91d5492b9ff
Tampered txDigest: 0xa9e9be8cc4a4e8bfcc0d901644dc527e5848a1e8ce938839a9e0853dabd3b472
```

Completed:

```text
[OK] Gateway rejected calldata modified after signing.
[OK] Tampered transaction was not relayed to Besu.
[OK] Calldata integrity is protected by canonical digest signing.
```

---

## 16. pqNonce Replay Protection Test

The PQC Gateway was tested for pqNonce replay protection.

Test sequence:

```text
1. Send pqNonce = 1.
2. Send pqNonce = 1 again with the same sender.
3. Send pqNonce = 2 with the same sender.
```

Observed behavior:

```text
First pqNonce = 1 transaction accepted.
Second pqNonce = 1 transaction rejected.
pqNonce = 2 transaction accepted.
```

Completed:

```text
[OK] Gateway tracks pqNonce per PQC sender.
[OK] Reused pqNonce is rejected.
[OK] Next valid pqNonce is accepted.
[OK] Replay protection works at gateway level.
```

---

## 17. Backend Demo API

The backend demo API has been implemented.

Backend endpoint:

```text
http://127.0.0.1:4000
```

Backend endpoints:

```text
GET  /health
POST /demo/check-besu
POST /demo/send-valid-mldsa
POST /demo/send-invalid-signature
POST /demo/send-tampered-calldata
```

Completed:

```text
[OK] Backend API server runs locally.
[OK] Backend health endpoint works.
[OK] Backend can check Besu RPC.
[OK] Backend can trigger valid ML-DSA demo.
[OK] Backend can trigger invalid signature test.
[OK] Backend can trigger tampered calldata test.
[OK] Backend connects frontend to gateway demo flows.
```

---

## 18. Backend Direct Transaction Builder

The backend has been upgraded from a shell-script wrapper to a direct transaction builder.

Direct endpoint:

```text
POST /direct/send-valid-mldsa
```

Direct backend flow:

```text
Frontend / curl
→ Backend
→ ABI calldata builder
→ canonical raw PQC transaction builder
→ ML-DSA-65 signer
→ local ML-DSA-65 verifier
→ PQC Gateway
→ Besu QBFT
→ BusinessContract
```

Completed:

```text
[OK] Backend builds ABI calldata directly.
[OK] Backend builds canonical raw PQC transaction fields directly.
[OK] Backend computes txDigest directly.
[OK] Backend signs txDigest using ML-DSA-65.
[OK] Backend verifies ML-DSA-65 signature locally.
[OK] Backend submits rawPqcTransaction to PQC Gateway.
[OK] Gateway verifies and relays the backend-built transaction.
[OK] Besu includes the transaction in a QBFT block.
[OK] BusinessContract state update succeeds.
```

Direct backend evidence:

```text
sender: 0xd7d8bd204ff1d45772979c7eaea3cd62e7d7411d
txDigest: 0x6bb2d3cedb7a16cd5fc8a71fb46133c21b285fcfc8b8251ebbfac214424f522f
signatureValid: true
pqPublicKeyBytes: 1952
pqSignatureBytes: 3309
gateway accepted: true
txHash: 0x289ac1da45f527baa92b1b48bbe00cb1e031b188d72d5f1a3d796d3442d5a483
receiptStatus: 1
blockNumber: 993
counterAfter: 7
```

---

## 19. Backend-Managed PQC Wallet Nonce

The backend direct mode has been improved to behave more like a dApp wallet.

Completed:

```text
[OK] Backend keeps a stable ML-DSA-65 keypair while running.
[OK] Backend derives one stable PQC sender from the ML-DSA public key.
[OK] Backend manages auto pqNonce for repeated frontend transactions.
[OK] Repeated frontend Buy actions can create new valid transactions.
```

This fixes the previous issue where each request generated a new keypair and manual nonce handling made repeated frontend transactions unreliable.

---

## 20. Receipt and Event Evidence

Receipt and event evidence for the valid ML-DSA gateway transaction has been collected.

Evidence file:

```text
results/receipts/plan-a-valid-mldsa-receipt.json
```

Collected evidence includes:

```text
[OK] Transaction hash.
[OK] Receipt status.
[OK] Block number.
[OK] Block hash.
[OK] Gas used.
[OK] PQC sender.
[OK] Contract counter state.
[OK] Parsed PQCActionExecuted event.
```

Observed parsed event:

```text
PQCActionExecuted(
  pqcSender = 0x1581bbb939C82F2d94F60675Da2baF88BA0c104f,
  relayer   = 0x2f1AD402D1F8421BBF044417F509bb3119d7a79d,
  value     = 7,
  counter   = 7
)
```

Completed:

```text
[OK] Successful receipt saved.
[OK] Event log parsed.
[OK] State update evidence saved.
```

---

## 21. Frontend Dashboard

A React + Tailwind frontend dashboard has been implemented.

Frontend endpoint:

```text
http://127.0.0.1:5173
```

Completed:

```text
[OK] Light dashboard UI implemented.
[OK] Backend health status displayed.
[OK] Besu RPC status displayed.
[OK] Latest blocks displayed.
[OK] Buy / Send ML-DSA transaction button implemented.
[OK] Invalid signature test button implemented.
[OK] Tampered calldata test button implemented.
[OK] Latest transaction panel implemented.
[OK] PQC transaction dump implemented.
[OK] Run history panel implemented.
```

Frontend flow:

```text
Frontend
→ Backend API
→ PQC Gateway
→ Besu QBFT network
→ BusinessContract
```

---

## 22. PQC Transaction Dump

The frontend displays a custom PQC transaction dump.

This dump is not a Bitcoin transaction format. It is specific to this project.

Dump contents:

```text
network
contractCall
pqcRawTransaction
canonicalSigning
gatewayVerification
besuRelay
blockEvidence
```

Important fields shown:

```text
pqPublicKey
pqSignature
sender
txDigest
ABI calldata
ML-DSA-65 algorithm
signature verification result
gateway accepted status
Besu txHash
receipt status
block number
contract counter state
```

Completed:

```text
[OK] PQC public key is displayed.
[OK] PQC signature is displayed.
[OK] txDigest is displayed.
[OK] ABI calldata is displayed.
[OK] Gateway verification result is displayed.
[OK] Besu relay result is displayed.
```

---

## 23. Demo Runner Scripts

Reusable demo scripts have been added.

Scripts:

```text
scripts/check-besu-rpc.sh
scripts/run-gateway.sh
scripts/send-valid-mldsa-tx.sh
scripts/send-invalid-signature.sh
scripts/send-tampered-calldata.sh
```

Completed:

```text
[OK] Script to check Besu RPC.
[OK] Script to run PQC Gateway.
[OK] Script to send valid ML-DSA transaction.
[OK] Script to send invalid signature test.
[OK] Script to send tampered calldata test.
```

---

## 24. Current Completed Capabilities

Current completed capabilities:

```text
[OK] Project workspace created.
[OK] Besu fork prepared.
[OK] Besu builds from source.
[OK] Local Besu RPC works.
[OK] Local QBFT private network runs.
[OK] QBFT block production works.
[OK] BusinessContract deployed.
[OK] Contract bytecode verified on-chain.
[OK] Relayer-based contract execution works.
[OK] Canonical PQC transaction encoding works.
[OK] PQC sender derivation works.
[OK] ML-DSA-65 key generation works.
[OK] ML-DSA-65 signing works.
[OK] ML-DSA-65 verification works.
[OK] Raw PQC transaction generation works.
[OK] Backend directly builds ABI calldata.
[OK] Backend directly signs raw PQC transaction with ML-DSA-65.
[OK] PQC Gateway verifies ML-DSA-65 signatures.
[OK] PQC Gateway rejects invalid signatures.
[OK] PQC Gateway rejects tampered calldata.
[OK] PQC Gateway checks pqNonce.
[OK] PQC Gateway rejects reused pqNonce.
[OK] PQC Gateway relays valid transactions to Besu.
[OK] Besu includes relayed transactions in QBFT blocks.
[OK] BusinessContract state update is verified.
[OK] Receipt and event evidence collected.
[OK] Frontend dashboard implemented.
[OK] PQC transaction dump implemented.
```

---

## 25. Current Plan A Status

The main Plan A Gateway PoC flow is completed.

The current system demonstrates:

```text
A real Besu private QBFT network.
A deployed BusinessContract.
Backend-built ABI calldata.
Backend-built raw PQC transaction.
Canonical transaction encoding.
ML-DSA-65 signing.
ML-DSA-65 verification at the PQC Gateway.
PQC sender derivation from pqPublicKey.
pqNonce replay protection.
Gateway rejection of invalid signatures.
Gateway rejection of calldata modified after signing.
Gateway relay of valid PQC transactions to Besu.
QBFT block inclusion.
Successful EVM execution.
Successful receipt and state update.
Frontend dApp-style dashboard.
PQC transaction dump with public key and signature.
```

Plan A claim:

```text
Plan A demonstrates pre-chain ML-DSA-65 transaction verification through a PQC Gateway in front of a real Besu QBFT private network.
```

---

## 26. Important Non-Claims

The project must not claim the following for Plan A:

```text
[NO] Besu native transaction validation uses ML-DSA.
[NO] Besu txpool accepts native PQC transactions.
[NO] QBFT consensus messages are signed with ML-DSA.
[NO] The system is Ethereum mainnet compatible.
[NO] The gateway alone makes Besu fully quantum-safe at the protocol level.
```

These are Plan B or future-work targets.

---

## 27. Not Completed Yet

The following parts are not completed yet:

```text
[ ] README/runbook for full demo startup.
[ ] Final report writing.
[ ] More automated integration tests.
[ ] Plan B1 Besu custom RPC method.
[ ] Plan B2 native PQC transaction path.
[ ] Plan B3 PQC-QBFT consensus integration.
```

---

## 28. Summary

The project has completed the core blockchain execution, PQC Gateway verification, backend direct transaction building, and frontend dashboard for Plan A.

At this stage, the system can demonstrate:

```text
A real Besu private QBFT network.
A deployed smart contract.
A trusted gateway relayer model.
A backend-built raw PQC transaction.
A raw PQC transaction signed with real ML-DSA-65.
Gateway-side ML-DSA-65 verification.
Gateway-side pqNonce replay protection.
Gateway-side calldata integrity protection.
Valid transaction relay into Besu.
QBFT block inclusion.
Successful EVM execution.
Successful receipt and state update.
Frontend dashboard interaction.
PQC transaction dump containing pqPublicKey and pqSignature.
```

---

## 29. Plan B1.0 Besu PQC RPC Entry

An experimental Besu-side RPC method has been added in the Besu fork:

```text
eth_sendRawPqcTransaction
```

This method currently implements Plan B1.0 entry-layer functionality.

Completed in Besu fork:

```text
[OK] New RPC enum added.
[OK] New RPC method class added.
[OK] RPC method registered in EthJsonRpcMethods.
[OK] Besu accepts raw PQC transaction object through JSON-RPC.
[OK] Besu parses raw PQC transaction fields.
[OK] Besu recomputes canonicalTxBytes.
[OK] Besu recomputes txDigest.
[OK] Besu derives sender from pqPublicKey.
[OK] Besu rejects malformed/sender-mismatched input path.
```

Observed evidence:

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

Current limitation:

```text
Java-side ML-DSA-65 cryptographic verification is not implemented yet.
The current B1.0 implementation verifies parsing, canonical encoding, txDigest computation, sender derivation, and ML-DSA key/signature length.
```

Next target:

```text
Plan B1.1: integrate Java-side ML-DSA-65 verification into eth_sendRawPqcTransaction.
```
