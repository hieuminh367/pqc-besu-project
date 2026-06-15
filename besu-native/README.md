# Besu Native PQC Patch Points

This folder tracks the Besu-side notes for:

```text
B1: entry-layer RPC verification
B2: native PQC typed transaction path
B3: future PQC-QBFT work
```

Current Besu fork branch used by the app demo:

```text
plan-b2-native-pqc-tx
```

## 1. Native PQC Flow

The stabilized app demo flow is:

```text
frontend
  -> backend /plan-b/native-buy
  -> ABI encode executeNativePQC(uint256)
  -> canonical tx digest
  -> ML-DSA-65 signature
  -> native typed transaction 0x05
  -> Besu eth_sendRawTransaction
  -> QBFT block inclusion
  -> receipt status 0x1
```

## 2. Key Besu Fork Patch Points

Entry-layer RPC:

```text
ethereum/api/src/main/java/org/hyperledger/besu/ethereum/api/jsonrpc/RpcMethod.java
ethereum/api/src/main/java/org/hyperledger/besu/ethereum/api/jsonrpc/methods/EthJsonRpcMethods.java
ethereum/api/src/main/java/org/hyperledger/besu/ethereum/api/jsonrpc/internal/methods/EthSendRawPqcTransaction.java
ethereum/api/src/main/java/org/hyperledger/besu/ethereum/api/jsonrpc/internal/pqc/MldsaVerifier.java
```

Native PQC typed transaction path:

```text
ethereum/core/src/main/java/org/hyperledger/besu/ethereum/core/Transaction.java
ethereum/core/src/main/java/org/hyperledger/besu/ethereum/core/encoding/TransactionEncoder.java
ethereum/core/src/main/java/org/hyperledger/besu/ethereum/core/encoding/TransactionDecoder.java
ethereum/core/src/main/java/org/hyperledger/besu/ethereum/core/encoding/PqcTransactionEncoder.java
ethereum/core/src/main/java/org/hyperledger/besu/ethereum/core/encoding/PqcTransactionDecoder.java
ethereum/core/src/main/java/org/hyperledger/besu/ethereum/core/pqc/PqcSenderDerivation.java
ethereum/core/src/main/java/org/hyperledger/besu/ethereum/core/pqc/MldsaVerifier.java
ethereum/core/src/main/java/org/hyperledger/besu/ethereum/core/pqc/PqcTransactionValidator.java
ethereum/core/src/main/java/org/hyperledger/besu/ethereum/mainnet/MainnetTransactionValidator.java
```

Block-selection tweaks for native PQC transactions:

```text
ethereum/blockcreation/src/main/java/org/hyperledger/besu/ethereum/blockcreation/txselection/selectors/PriceTransactionSelector.java
ethereum/blockcreation/src/main/java/org/hyperledger/besu/ethereum/blockcreation/txselection/selectors/MinPriorityFeePerGasTransactionSelector.java
```

## 3. Smoke Check

Recommended smoke-check command for the modules touched by the native PQC path:

```text
cd ~/pqc-besu-project/besu-fork
./gradlew :ethereum:api:compileJava :ethereum:core:compileJava :ethereum:blockcreation:compileJava
```

Observed result on the current branch:

```text
BUILD SUCCESSFUL
:ethereum:api:compileJava
:ethereum:core:compileJava
:ethereum:blockcreation:compileJava
```

This is the build-level check used before expanding into deeper Besu tests.
