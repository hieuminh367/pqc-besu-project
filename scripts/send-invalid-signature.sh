#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../pqc-core"

echo "[*] Sending raw PQC transaction with invalid signature"
npm run send:invalid-signature
