#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../pqc-gateway"

echo "[*] Starting PQC Gateway..."
echo "[*] Health endpoint: http://127.0.0.1:3001/health"

npm run dev
