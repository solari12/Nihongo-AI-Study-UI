# Checklist dàn trang Word cho báo cáo ĐATN 2026

File nội dung chính: `docs/graduation-report-innovation-2026.md`

## 1. Thông tin cần xác nhận trước khi nộp

- Tên đề tài: `Xây dựng ứng dụng web học tiếng Nhật sơ cấp tích hợp chatbot AI RAG và hệ thống gợi ý lộ trình học dựa trên hành vi người dùng`
- Sinh viên: `Nguyễn Văn Tuấn`
- Mã sinh viên: `22CE089`
- Lớp: `22SE1B`
- Ngành: `Kỹ thuật phần mềm`
- GVHD: `ThS. Ngô Lê Quân`
- Năm: `2026`

## 2. Cần chèn ảnh minh họa

- Trang onboarding tạo lộ trình.
- Trang placement test có context từ hồ sơ.
- Trang learning path có task card và trạng thái hoàn thành hôm nay.
- Phiên học từ vựng.
- Phiên học ngữ pháp.
- Chatbot Kami có câu trả lời và nguồn tham khảo.
- Trang reading/TODAII có furigana/audio.
- Kết quả `pnpm test:e2e` pass 6/6.

## 3. Cần tạo tự động trong Word

- Mục lục tự động.
- Danh mục bảng.
- Danh mục hình.
- Số trang.
- Header/footer theo mẫu khoa nếu có.

## 4. Định dạng đề xuất

- Font: Times New Roman.
- Cỡ chữ nội dung: 13.
- Giãn dòng: 1.3 hoặc 1.5 theo yêu cầu GVHD.
- Căn đều hai lề.
- Heading 1 cho chương.
- Heading 2/3 cho mục con.
- Bảng biểu có caption dạng `Bảng x.y`.
- Hình ảnh có caption dạng `Hình x.y`.

## 5. Kiểm tra cuối

- Không để thuật ngữ kỹ thuật chưa giải thích như `coldStartScore` trong phần giao diện người dùng.
- Không tuyên bố đã huấn luyện mô hình ML nếu thực tế recommendation đang là rule-based XAI + BKT/SM-2-inspired.
- Với RAG, mô tả đúng là PostgreSQL lưu embedding dạng JSON và cosine similarity tính trong backend, chưa dùng `pgvector`.
- Với kiểm thử, ghi đúng kết quả gần nhất: typecheck pass, build pass, Playwright e2e pass 6/6.

