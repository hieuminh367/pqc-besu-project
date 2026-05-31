# Completed Summary - PQC Besu Project

## 1. Project Structure

Project workspace has been created with two main parts:

```text
~/pqc-besu-project/
├── app/
└── besu-fork/
```

app/ contains the application-level project code such as contracts, backend, frontend, PQC core logic, PQC gateway, network configuration, scripts, documentation, and demo results.

besu-fork/ contains the Hyperledger Besu source code for future native PQC upgrade.

Current Besu branch:

pqc-native-upgrade
2. Besu Build

Hyperledger Besu has been built successfully from source using Java 25.

Verified Besu version:

besu/v26.5-develop-b77d00f/linux-x86_64/openjdk-java-25

Completed:

[OK] Besu source code prepared.
[OK] Java 25 configured.
[OK] Besu builds successfully.
[OK] Besu binary runs successfully.
3. Development Environment

The local development environment has been configured.

Completed:

[OK] Node.js 22 configured.
[OK] Hardhat configured.
[OK] TypeScript configured.
[OK] Ethers.js installed.
[OK] Smart contract compilation works.
4. Besu RPC

A local Besu JSON-RPC endpoint has been started and verified.

RPC endpoint:

http://127.0.0.1:8545

Verified result:

web3_clientVersion returned the local Besu client version successfully.

Completed:

[OK] Besu node starts locally.
[OK] JSON-RPC endpoint works.
[OK] RPC connection from external tools works.
5. QBFT Private Network

A local private Besu network using QBFT consensus has been generated and started.

Network information:

Consensus: QBFT
Chain ID: 1337
RPC endpoint: http://127.0.0.1:8545

The QBFT network successfully produced blocks and included transactions.

Evidence:

Block #75 was produced with 1 transaction.
The pending transaction count returned to 0.
The transaction used 49,279 gas.

Completed:

[OK] Local QBFT network generated.
[OK] Validator nodes started.
[OK] QBFT block production works.
[OK] Transaction inclusion in QBFT block verified.
6. Smart Contract Deployment

BusinessContract has been deployed successfully to the Besu QBFT network.

Contract address:

0x6fDfeb70f1b4D35A7E11A2687B7bAf367cDeB7aA

Trusted gateway relayer:

0x2f1AD402D1F8421BBF044417F509bb3119d7a79d

The contract bytecode was verified on-chain using eth_getCode.

Completed:

[OK] BusinessContract compiled.
[OK] BusinessContract deployed.
[OK] Contract bytecode exists on-chain.
[OK] Trusted gateway relayer configured.
7. Contract Execution Test

The deployed contract was tested through the trusted relayer model.

Test call:

executeFromPQC(pqcSender, 7)

Test PQC sender:

0x1111111111111111111111111111111111111111

Execution result:

Relayer: 0x2f1AD402D1F8421BBF044417F509bb3119d7a79d
Tx hash: 0x6c8840bbaf8d34f5673762a8f9111a286b8a92b2b86ae795b8c5e1da08c416d1
Receipt status: 1
Block number: 75
Counter before: 0
Counter after: 7

Completed:

[OK] Relayer submitted transaction to Besu.
[OK] Transaction was included in QBFT block #75.
[OK] Receipt status was successful.
[OK] BusinessContract executed successfully.
[OK] Contract state changed from 0 to 7.
[OK] Trusted relayer model works.
8. Current Completed Status

Current completed capabilities:

[OK] Project workspace created.
[OK] Besu fork prepared.
[OK] Besu builds from source.
[OK] Local Besu RPC works.
[OK] Local QBFT private network runs.
[OK] QBFT block production works.
[OK] Smart contract deployed.
[OK] Contract bytecode verified on-chain.
[OK] Relayer-based contract execution works.
[OK] Transaction receipt success verified.
[OK] State update verified.
9. Summary

The project has completed the blockchain execution foundation for Plan A.

At this stage, the system can demonstrate:

A real Besu private QBFT network.
A deployed smart contract.
A trusted gateway relayer model.
A successful transaction submitted by the relayer.
A transaction included in a QBFT block.
Successful EVM execution.
Successful receipt and state update.

The next step is to implement the PQC transaction layer in pqc-core/ and pqc-gateway/.

---

## 10. PQC Core Transaction Pipeline

The initial `pqc-core` module has been implemented.

Completed components:

```text
[OK] Canonical transaction encoder implemented.
[OK] Transaction digest generation implemented.
[OK] PQC sender derivation implemented.
[OK] Demo key generation implemented.
[OK] Demo signing implemented.
[OK] Demo verification implemented.
[OK] Raw PQC transaction object generation implemented.

The demo generated a canonical PQC transaction, computed its transaction digest, signed it, verified the signature, derived the PQC sender, and printed a raw PQC transaction object.

Verification result:

signatureValid: true

Generated PQC sender:

0xfcaa6bc87bbb1fa949bc5b27c6d6e28eebe936df

Generated transaction digest:

0x9fed7fb28feb4ad3a0409f65798406140ed732ee730c9895e252cc094ca043ef

The generated raw PQC transaction targets the deployed BusinessContract:

0x6fDfeb70f1b4D35A7E11A2687B7bAf367cDeB7aA

The ABI calldata calls:

executeFromPQC(sender, 7)

Current limitation:

The current signing module uses a demo signature backend with the same interface expected from ML-DSA.
It will later be replaced with the real ML-DSA implementation.

---

## Correction: Demo Signature Backend

The current `pqc-core` signing demo uses Ed25519 only as a temporary development backend.

Ed25519 is not a post-quantum signature algorithm.

This demo backend is used only to test the transaction pipeline:

```text
canonical transaction fields
→ canonicalTxBytes
→ txDigest
→ sign function
→ verify function
→ sender derivation
→ raw transaction object
```

The post-quantum target signature algorithm remains:

ML-DSA

Therefore, the current completed claim is:

[OK] Transaction signing and verification pipeline works with a temporary demo signature backend.
[OK] The interface is ready to be replaced by ML-DSA.

The current stage must not be claimed as real PQC signature verification yet.
