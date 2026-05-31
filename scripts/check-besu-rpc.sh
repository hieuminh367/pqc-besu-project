#!/usr/bin/env bash
set -euo pipefail

RPC_URL="${BESU_RPC_URL:-http://127.0.0.1:8545}"

echo "[*] Checking Besu RPC: $RPC_URL"

curl -s -X POST "$RPC_URL" \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"web3_clientVersion","params":[],"id":1}' | jq .

curl -s -X POST "$RPC_URL" \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":2}' | jq .

curl -s -X POST "$RPC_URL" \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":3}' | jq .
