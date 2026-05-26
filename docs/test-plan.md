# Kế hoạch kiểm thử

## 1. Mục tiêu kiểm thử

Đảm bảo các chức năng chính của Nihongo AI Study hoạt động ổn định:

- Học từ vựng.
- Học ngữ pháp.
- Làm quiz.
- Ghi lịch sử học tập.
- Sinh gợi ý học tập.
- Quản trị nội dung.
- Chatbot RAG.

## 2. Kiểm thử chức năng

### 2.1. Landing page

| Test case | Kết quả mong đợi |
|---|---|
| Mở `/` | Hiển thị landing page giới thiệu hệ thống |
| Click Đăng nhập | Điều hướng đến `/login` |
| Click Đăng ký | Điều hướng đến `/register` |
| Click Vào học ngay | Điều hướng đến `/dashboard` |

### 2.2. Vocabulary

| Test case | Kết quả mong đợi |
|---|---|
| Mở `/vocabulary` | Hiển thị danh sách từ vựng |
| Tìm từ bằng romaji | Lọc đúng từ |
| Đánh dấu đã học | Tiến độ tăng, activity log được ghi |
| Thêm ôn tập | Số từ cần ôn tăng, activity log được ghi |

### 2.3. Grammar

| Test case | Kết quả mong đợi |
|---|---|
| Mở `/grammar` | Hiển thị danh sách ngữ pháp |
| Lọc theo trạng thái | Danh sách thay đổi đúng |
| Xem ví dụ | Hiển thị ví dụ tiếng Nhật và tiếng Việt |

### 2.4. Quiz

| Test case | Kết quả mong đợi |
|---|---|
| Chọn loại quiz | Câu hỏi được lọc theo loại |
| Trả lời đủ câu | Cho phép hoàn thành |
| Nộp quiz | Hiển thị điểm, đáp án đúng và giải thích |
| Hoàn thành quiz | Lưu quiz attempt và activity log |

### 2.5. History

| Test case | Kết quả mong đợi |
|---|---|
| Chưa có hoạt động | Hiển thị empty state |
| Có hoạt động học từ | Table hiển thị activity |
| Có quiz attempt | Chart điểm quiz cập nhật |
| Lọc theo loại | Chỉ hiển thị activity tương ứng |
| Lọc theo thời gian | Chỉ hiển thị activity trong khoảng chọn |

### 2.6. Recommendation

| Test case | Kết quả mong đợi |
|---|---|
| Có từ cần ôn | Gợi ý ôn tập xuất hiện |
| Quiz điểm thấp | Gợi ý làm quiz củng cố xuất hiện |
| Còn từ chưa học | Gợi ý học từ mới xuất hiện |
| Chưa học nhiều ngày | Gợi ý phiên học ngắn xuất hiện |

### 2.7. Admin

| Test case | Kết quả mong đợi |
|---|---|
| Thêm từ vựng | Từ mới xuất hiện trong admin và vocabulary |
| Sửa ngữ pháp | Nội dung cập nhật trong grammar |
| Xóa quiz | Quiz không còn xuất hiện |
| Export JSON | Tải file JSON chứa vocabulary, grammar, quiz |
| Import JSON hợp lệ | Dữ liệu được thay thế |
| Import JSON sai format | Hiển thị thông báo lỗi |

### 2.8. Chatbot

| Test case | Kết quả mong đợi |
|---|---|
| Hỏi từ có trong dữ liệu | Trả lời đúng và có source |
| Hỏi ngữ pháp có trong dữ liệu | Trả lời theo nguồn grammar |
| Hỏi nội dung không có dữ liệu | Trả lời rằng chưa đủ nguồn |
| OpenRouter lỗi/mất key | Fallback answer vẫn hoạt động |

## 3. Kiểm thử tích hợp

### Luồng 1: Admin nhập dữ liệu đến chatbot

```text
Admin thêm từ mới
  -> mở Vocabulary thấy từ mới
  -> hỏi chatbot về từ đó
  -> chatbot trả lời có source từ mới
```

### Luồng 2: Quiz đến recommendation

```text
User làm quiz điểm thấp
  -> lưu quiz attempt
  -> History hiển thị quiz
  -> Dashboard/Learning Path gợi ý làm quiz củng cố
```

### Luồng 3: Review đến recommendation

```text
User thêm từ vào ôn tập
  -> History ghi activity
  -> Recommendation ưu tiên ôn tập
```

## 4. Kiểm thử phi chức năng

| Tiêu chí | Cách kiểm thử |
|---|---|
| Responsive | Mở trên mobile/desktop |
| Hiệu năng | Kiểm tra build và thao tác UI không lag |
| Bảo mật cơ bản | Không commit `.env.local` |
| Khả năng phục hồi | Import/export JSON để backup dữ liệu |
| Khả năng mở rộng | Kiến trúc tách data/API/AI module |

## 5. Lệnh kiểm thử

```bash
corepack pnpm run build
```

Kỳ vọng:

```text
Compiled successfully
Generating static pages completed
```
