# Kiến trúc hệ thống Nihongo AI Study

## 1. Tổng quan

Nihongo AI Study là ứng dụng web học tiếng Nhật trình độ N5, tích hợp các chức năng học từ vựng, học ngữ pháp, quiz, lịch sử học tập, quản trị nội dung, chatbot RAG và hệ khuyến nghị lộ trình học.

Kiến trúc hiện tại được xây dựng theo mô hình Next.js App Router:

```text
Frontend UI
  -> Next.js pages/components
  -> Client state + localStorage stores
  -> API routes
  -> AI modules / RAG modules
```

Ở giai đoạn MVP, dữ liệu được lưu ở localStorage để dễ demo. Kiến trúc vẫn tách rõ các lớp để sau này chuyển sang database thật.

## 2. Các module chính

### 2.1. Frontend

Frontend gồm các màn hình:

- Landing page: giới thiệu hệ thống và các chức năng.
- Login/Register: giao diện đăng nhập/đăng ký demo.
- Dashboard: tổng quan tiến độ, bài học đề xuất, hoạt động gần đây.
- Vocabulary: học và đánh dấu từ vựng.
- Grammar: xem và học mẫu ngữ pháp.
- Quiz: làm bài kiểm tra và xem kết quả.
- History: xem lịch sử học tập thật từ activity log.
- Learning Path: xem lộ trình học cá nhân hóa.
- Admin: quản lý nội dung vocabulary, grammar, quiz.
- Chatbot: hỏi đáp AI theo kiến trúc RAG.

### 2.2. Data layer

Nguồn dữ liệu seed nằm ở:

```text
lib/data/nihongo-study.ts
```

Dữ liệu admin chỉnh sửa được lưu ở:

```text
hooks/use-admin-content.ts
```

Các dữ liệu tiến độ/lịch sử lưu ở:

```text
hooks/use-study-progress.ts
hooks/use-activity-log.ts
```

### 2.3. API routes

Các API routes hiện có:

```text
GET  /api/vocabulary
GET  /api/grammar
GET  /api/quiz
POST /api/quiz/submit
POST /api/chat
```

Mục đích:

- Vocabulary/Grammar/Quiz API cung cấp dữ liệu học tập.
- Quiz submit API chấm điểm bài quiz.
- Chat API truy xuất nguồn và gọi OpenRouter để sinh câu trả lời.

### 2.4. AI modules

Hệ thống có hai module AI chính:

1. Chatbot RAG:
   - Retriever tìm nguồn liên quan trong vocabulary, grammar, quiz.
   - Prompt builder đưa nguồn vào prompt.
   - Generator gọi OpenRouter hoặc fallback template.

2. Recommendation engine:
   - Phân tích progress và activity log.
   - Dùng BKT để ước lượng mức nắm kiến thức.
   - Dùng SM-2/spaced repetition để ưu tiên nội dung cần ôn.
   - Trả về recommendation kèm lý do và priority score.

## 3. Luồng dữ liệu chính

### 3.1. Học từ vựng

```text
User chọn từ vựng
  -> markVocabularyLearned()
  -> lưu learnedVocabularyIds vào localStorage
  -> addActivity()
  -> History/Dashboard/Recommendation cập nhật
```

### 3.2. Làm quiz

```text
User làm quiz
  -> POST /api/quiz/submit
  -> nhận score/percentage
  -> recordQuizAttempt()
  -> addActivity()
  -> Recommendation engine cập nhật đề xuất
```

### 3.3. Chatbot RAG

```text
User gửi câu hỏi
  -> POST /api/chat
  -> retrieveSources()
  -> buildChatPrompt()
  -> OpenRouter chat completion
  -> trả answer + sources về UI
```

## 4. Khả năng mở rộng

Kiến trúc hiện tại có thể nâng cấp theo hướng:

- Thay localStorage bằng database.
- Thêm authentication thật.
- Lưu activity log trên server.
- Dùng vector database cho RAG.
- Dùng embedding để retrieval tốt hơn.
- Thêm analytics/admin dashboard thật.

## 5. Công nghệ sử dụng

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide icons
- Recharts
- OpenRouter API

## 6. Giới hạn hiện tại

- Login/Register mới là giao diện demo.
- Dữ liệu admin đang lưu localStorage.
- RAG MVP dùng keyword retrieval, chưa dùng vector search.
- Recommendation engine là rule-based kết hợp BKT/SM-2, chưa huấn luyện ML model riêng.
