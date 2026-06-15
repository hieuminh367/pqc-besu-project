# PQC Besu Project - Completed Summary (Plan B)

Mục tiêu nộp hiện tại:

- Plan B1: tích hợp RPC `eth_sendRawPqcTransaction` ở lớp vào của Besu để xác thực ML-DSA tại phía node.
- Plan B2: thực thi giao dịch PQC kiểu native kiểu 0x05 qua luồng frontend -> backend -> `eth_sendRawTransaction`.

Thành phần đã hoàn tất cho bản nộp:

- Mạng Besu QBFT fork chạy được local.
- Backend có endpoint Plan B native:
  - `POST /plan-b/native-buy`
  - `GET /plan-b/native-counter/:sender`
- Frontend dashboard gọi trực tiếp API native này.
- Cơ chế ký/serialize native PQC transaction type 0x05.
- Hệ thống sinh giao dịch thử cho cả Plan B1 và Plan B2 ở `pqc-core`.
- Bằng chứng log/receipt cho Plan B2 nằm trong `results/`.

Lưu ý: các tài liệu/chứng cứ liên quan relayer-gateway legacy đã chuyển sang `docs/legacy` để phục vụ tham chiếu.
