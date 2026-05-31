#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../pqc-core"

echo "[*] Sending raw PQC transaction with tampered calldata"
npm run send:tampered-calldata
