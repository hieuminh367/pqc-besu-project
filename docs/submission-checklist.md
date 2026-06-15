# Submission Checklist (Plan B)

Mục tiêu: giúp reviewer kiểm tra nhanh đúng scope nộp.

## 1. Scope check

- [ ] Confirm implementation is Plan B focused (no active gateway service/references in runtime flow).
- [ ] Confirm backend exposes:
  - `POST /plan-b/native-buy`
  - `GET /plan-b/native-counter/:sender`
- [ ] Confirm frontend invokes native endpoint directly (no `/demo/*`, `/direct/*`).

## 2. Technical claims to verify

- [ ] Plan B1: `eth_sendRawPqcTransaction` accepts raw PQC transaction object in Besu fork.
- [ ] Plan B1: Besu-side ML-DSA-65 verification works and invalid signatures are rejected.
- [ ] Plan B2: Backend builds `0x05` native PQC tx and sends via `eth_sendRawTransaction`.
- [ ] Plan B2: Transaction is included in QBFT block and `receipt.status = 0x1`.
- [ ] Plan B2: `msg.sender` used by contract is PQC-derived address from `pqPublicKey`.

## 3. Required evidence files

- [ ] `docs/plan-b2-progress.md` updated to native app stabilization and test results.
- [ ] `docs/plan-b1-progress.md` updated for entry-layer verification coverage.
- [ ] `results/demo-logs/plan-b2-native-pqc-block-execution-success.txt`.
- [ ] `results/demo-logs/plan-b2-native-pqc-typed-valid-test.txt`.
- [ ] `results/demo-logs/plan-b2-native-pqc-typed-invalid-signature-test.txt`.

## 4. Final packaging

- [ ] Legacy gateway materials only appear under `docs/legacy/` and `results/legacy/`.
- [ ] `app/pqc-gateway` removed from active code path for submission branch.
- [ ] `.env` not committed; only `.env.example` is documented.
