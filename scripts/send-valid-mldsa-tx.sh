#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../pqc-core"

PQ_NONCE="${PQ_NONCE:-1}"

echo "[*] Sending valid ML-DSA-65 raw PQC transaction"
echo "[*] PQ_NONCE=$PQ_NONCE"

PQ_NONCE="$PQ_NONCE" npm run send:mldsa:besu-rpc
