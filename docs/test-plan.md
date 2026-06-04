# Kế Hoạch Và Kết Quả Kiểm Thử

## Mục tiêu

Chứng minh các chức năng chính trong PRD hoạt động đủ ổn định cho bảo vệ:

- Đăng nhập/đăng ký và session.
- Học từ vựng, ngữ pháp.
- Làm quiz và lưu kết quả.
- Chatbot RAG/fallback.
- Recommendation trên Dashboard/Learning Path.
- Reading/TODAII render được dữ liệu nếu database đã import.

## Lệnh kiểm thử

```bash
pnpm build
npx tsc --noEmit
pnpm test:e2e
pnpm data:generate:embeddings
```

Điều kiện trước khi chạy E2E:

- Đã cấu hình `DATABASE_URL` trong `.env.local`.
- Đã chạy migration và seed:

```bash
pnpm db:migrate
pnpm db:seed
pnpm data:generate:embeddings
```

Tài khoản seed dùng cho E2E:

```text
Email: learner@example.com
Password: password123
```

Có thể override bằng:

```bash
E2E_LEARNER_EMAIL=... E2E_LEARNER_PASSWORD=... pnpm test:e2e
```

## E2E Smoke Test

File test: `tests/e2e/prd-defense.spec.ts`.

| Flow | Kỳ vọng |
|---|---|
| Landing + login | Mở landing, vào login, đăng nhập thành công |
| Vocabulary | Trang từ vựng render, search cơ bản hoạt động nếu có input |
| Grammar | Trang ngữ pháp render được nội dung |
| Dashboard/Learning Path | Hiển thị recommendation hoặc vùng lộ trình học |
| Quiz | Bắt đầu quiz, chọn đáp án, nộp bài, thấy kết quả |
| Chatbot | Gửi câu hỏi N5, nhận câu trả lời có source hoặc fallback rõ ràng |
| Reading | Trang reading render, không crash kể cả khi chưa import bài |

## Test RAG thủ công

| Câu hỏi | Kỳ vọng |
|---|---|
| Kiểm tra DB sau `pnpm data:generate:embeddings` | Các dòng `knowledge_chunks` có `embedding` là mảng số |
| `学生 nghĩa là gì?` | Trả nghĩa, cách đọc, ví dụ, nguồn từ vựng |
| `Giải thích N は N です` | Trả ý nghĩa, cấu trúc, ví dụ |
| `Tạo 5 câu quiz từ vựng N5` | Render quiz card A/B/C/D có đáp án ẩn đến khi nộp |
| Câu hỏi ngoài dữ liệu | Nói rõ chưa đủ dữ liệu và gợi ý hỏi cụ thể hơn |

## Test Recommendation thủ công

| Scenario | Kỳ vọng |
|---|---|
| User mới chưa onboarding | Gợi ý tạo hồ sơ học tập |
| Có từ cần review | Gợi ý ôn tập từ vựng |
| Quiz điểm thấp | Gợi ý làm quiz củng cố |
| Lâu không có activity | Gợi ý phiên học ngắn |

## Kết quả chạy gần nhất

```text
Ngày: 2026-06-04
Lệnh: npx tsc --noEmit
Kết quả: Pass
Lỗi còn lại: Không có
Ghi chú: Đã sửa lỗi type ở locale, saved-study-items và script import grammar.
```

```text
Ngày: 2026-06-04
Lệnh: pnpm data:generate:embeddings
Kết quả: Chưa chạy trong lần kiểm thử này
Lỗi còn lại: Cần OPENAI_API_KEY để gọi embedding API
Ghi chú: Có thể dùng OPENROUTER_API_KEY thay cho OPENAI_API_KEY. Đây là bước bắt buộc trước demo nếu muốn chứng minh pipeline vector theo PRD bằng dữ liệu thật.
```

```text
Ngày: 2026-06-04
Lệnh: pnpm build
Kết quả: Pass
Lỗi còn lại: Không có
Ghi chú: Next build vẫn đang cấu hình skip validation of types theo next.config.mjs, nhưng typecheck riêng đã pass.
```

```text
Ngày: 2026-06-04
Lệnh: pnpm test:e2e
Kết quả: Pass, 5/5 tests
Lỗi còn lại: Không có lỗi fail test
Ghi chú: Playwright cần cài Chromium bằng `pnpm exec playwright install chromium` trước lần chạy đầu. Dev server có warning LCP cho `/assets/sidebar.png`, không làm fail E2E.
```
