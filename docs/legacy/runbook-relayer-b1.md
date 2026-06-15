
Runbook - Relayer Gateway PoC and Plan B1 Besu PQC RPC

This runbook explains how to run the implemented relayer gateway PoC and Plan B1 Besu-side PQC RPC validation.

1. Prerequisites

Required tools:

```text
Java 25
Node.js 22
npm
curl
jq
Git
```

Project paths:

App repo:

```text
~/pqc-besu-project/app
```

Besu fork:

```text
~/pqc-besu-project/besu-fork
```

2. Build Besu Fork

```text
cd ~/pqc-besu-project/besu-fork

./gradlew build -x test
./gradlew installDist

Check version:

./build/install/besu/bin/besu --version

Expected:

besu/v26.5-develop-.../openjdk-java-25
```

3. Start Besu QBFT Network

The local QBFT network uses:

```text
Consensus: QBFT
Chain ID: 1337
Node 1 RPC: http://127.0.0.1:8545
```

Terminal 1: Validator 1

```text
cd ~/pqc-besu-project/besu-fork

./build/install/besu/bin/besu \
  --genesis-file=../app/network/genesis-qbft-4nodes.json \
  --data-path=/tmp/besu-node1 \
  --node-private-key-file=../app/network/validator-1/key \
  --p2p-port=30303 \
  --rpc-http-enabled=true \
  --rpc-http-host=0.0.0.0 \
  --rpc-http-port=8545 \
  --rpc-http-api=ETH,NET,WEB3,ADMIN,TXPOOL,DEBUG,TRACE,QBFT \
  --host-allowlist="*" \
  --rpc-http-cors-origins="*"
```

Get bootnode:

```text
curl -s -X POST http://127.0.0.1:8545 \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"admin_nodeInfo","params":[],"id":1}' | jq .
```

Use the returned enode as BOOTNODE.

Terminal 2: Validator 2

```text
cd ~/pqc-besu-project/besu-fork

BOOTNODE="enode://REPLACE_WITH_NODE_1_ENODE@127.0.0.1:30303"

./build/install/besu/bin/besu \
  --genesis-file=../app/network/genesis-qbft-4nodes.json \
  --data-path=/tmp/besu-node2 \
  --node-private-key-file=../app/network/validator-2/key \
  --p2p-port=30304 \
  --bootnodes="$BOOTNODE" \
  --rpc-http-enabled=true \
  --rpc-http-host=0.0.0.0 \
  --rpc-http-port=8546 \
  --rpc-http-api=ETH,NET,WEB3,ADMIN,TXPOOL,DEBUG,TRACE,QBFT \
  --host-allowlist="*" \
  --rpc-http-cors-origins="*"
```

Terminal 3: Validator 3

```text
cd ~/pqc-besu-project/besu-fork

BOOTNODE="enode://REPLACE_WITH_NODE_1_ENODE@127.0.0.1:30303"

./build/install/besu/bin/besu \
  --genesis-file=../app/network/genesis-qbft-4nodes.json \
  --data-path=/tmp/besu-node3 \
  --node-private-key-file=../app/network/validator-3/key \
  --p2p-port=30305 \
  --bootnodes="$BOOTNODE" \
  --rpc-http-enabled=true \
  --rpc-http-host=0.0.0.0 \
  --rpc-http-port=8547 \
  --rpc-http-api=ETH,NET,WEB3,ADMIN,TXPOOL,DEBUG,TRACE,QBFT \
  --host-allowlist="*" \
  --rpc-http-cors-origins="*"
```

Terminal 4: Validator 4

```text
cd ~/pqc-besu-project/besu-fork

BOOTNODE="enode://REPLACE_WITH_NODE_1_ENODE@127.0.0.1:30303"

./build/install/besu/bin/besu \
  --genesis-file=../app/network/genesis-qbft-4nodes.json \
  --data-path=/tmp/besu-node4 \
  --node-private-key-file=../app/network/validator-4/key \
  --p2p-port=30306 \
  --bootnodes="$BOOTNODE" \
  --rpc-http-enabled=true \
  --rpc-http-host=0.0.0.0 \
  --rpc-http-port=8548 \
  --rpc-http-api=ETH,NET,WEB3,ADMIN,TXPOOL,DEBUG,TRACE,QBFT \
  --host-allowlist="*" \
  --rpc-http-cors-origins="*"
```

4. Check Besu Network

```text
cd ~/pqc-besu-project/app

./scripts/check-besu-rpc.sh
```

Expected:

```text
web3_clientVersion returns Besu version.
eth_blockNumber returns increasing block number.
net_peerCount returns 0x3.
```

5. Start PQC Gateway

```text
cd ~/pqc-besu-project/app
./scripts/run-gateway.sh
```

Health check:

```text
curl http://127.0.0.1:3001/health
```

6. Start Backend

```text
cd ~/pqc-besu-project/app/backend
npm run dev
```

Health check:

```text
curl http://127.0.0.1:4000/health
```

7. Start Frontend

```text
cd ~/pqc-besu-project/app/frontend
npm run dev
```

Open:

```text
http://127.0.0.1:5173
```

Frontend features:

```text
Buy / Send ML-DSA transaction
Latest blocks
Latest PQC transaction
PQC transaction dump with pqPublicKey and pqSignature
Invalid signature test
Tampered calldata test
Run history
```

8. Relayer Gateway CLI Tests

Valid ML-DSA transaction through Gateway:

```text
cd ~/pqc-besu-project/app
./scripts/send-valid-mldsa-tx.sh
```

Invalid signature:

```text
./scripts/send-invalid-signature.sh
```

Tampered calldata:

```text
./scripts/send-tampered-calldata.sh
```

Expected:

```text
Valid ML-DSA tx: accepted true, receiptStatus 1.
Invalid signature: rejected at signature-verification.
Tampered calldata: rejected at signature-verification.
```

9. Backend Direct Transaction Test

```text
curl -X POST http://127.0.0.1:4000/direct/send-valid-mldsa \
  -H "Content-Type: application/json" \
  --data '{"value":7}'
```

Expected:

```text
Backend builds ABI calldata.
Backend signs raw PQC transaction with ML-DSA-65.
Gateway verifies signature.
Besu includes transaction in QBFT block.
receiptStatus = 1.
```

10. Plan B1 Valid Besu RPC Test

```text
cd ~/pqc-besu-project/app/pqc-core
npm run send:mldsa:besu-rpc
```

Expected result:

```text
accepted: true
signatureVerification: verified-by-bouncycastle-mldsa65
signatureValid: true
besuSideMldsaVerification: true
```

This proves that Besu verifies ML-DSA-65 inside eth_sendRawPqcTransaction.

11. Plan B1 Invalid Besu RPC Test

```text
cd ~/pqc-besu-project/app/pqc-core
npm run send:invalid-mldsa:besu-rpc
```

Expected result:

```text
accepted: false
stage: mldsa-verification
reason: invalid ML-DSA-65 signature
signatureValid: false
```

This proves that Besu rejects invalid ML-DSA-65 signatures inside the custom RPC method.

12. Current Scope Boundary

Completed:

```text
Relayer Gateway PoC.
Plan B1 Besu entry-layer ML-DSA verification.
```

Not completed:

```text
Plan B2 native PQC txpool/account/block path.
Plan B3 PQC-QBFT consensus integration.
```
