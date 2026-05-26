# Thiết kế dữ liệu

## 1. Tổng quan

Trong MVP, hệ thống lưu dữ liệu bằng localStorage để thuận tiện demo. Tuy nhiên, cấu trúc dữ liệu đã được thiết kế để có thể chuyển sang database quan hệ hoặc Supabase/PostgreSQL.

## 2. Các thực thể chính

### 2.1. User

```text
users
- id
- full_name
- email
- password_hash
- role
- created_at
- updated_at
```

Vai trò:

- learner: người học.
- admin: quản trị nội dung.

### 2.2. Vocabulary

```text
vocabulary
- id
- japanese
- hiragana
- romaji
- vietnamese
- type
- topic
- example_japanese
- example_vietnamese
- created_at
- updated_at
```

### 2.3. Grammar

```text
grammar
- id
- pattern
- meaning
- structure
- usage_note
- example_japanese
- example_vietnamese
- difficulty
- status
- created_at
- updated_at
```

### 2.4. Quiz Question

```text
quiz_questions
- id
- question
- type
- difficulty
- topic
- correct_answer
- explanation
- created_at
- updated_at
```

### 2.5. Quiz Answer

```text
quiz_answers
- id
- question_id
- answer_key
- answer_text
```

### 2.6. User Progress

```text
user_progress
- id
- user_id
- learned_vocabulary_ids
- review_vocabulary_ids
- created_at
- updated_at
```

Trong database thật, có thể chuẩn hóa thành bảng nhiều-nhiều:

```text
user_vocabulary_progress
- user_id
- vocabulary_id
- status
- last_reviewed_at
- next_review_at
```

### 2.7. Quiz Attempt

```text
quiz_attempts
- id
- user_id
- quiz_type
- score
- total
- percentage
- created_at
```

### 2.8. Activity Log

```text
activity_logs
- id
- user_id
- type
- content
- topic
- result
- score
- duration_minutes
- created_at
```

### 2.9. Chat Log

```text
chat_logs
- id
- user_id
- message
- answer
- provider
- sources_json
- created_at
```

## 3. Quan hệ dữ liệu

```text
User 1 - n ActivityLog
User 1 - n QuizAttempt
User n - n Vocabulary
QuizQuestion 1 - n QuizAnswer
ChatLog n - n KnowledgeSource
```

## 4. Dữ liệu trong MVP

Trong mã hiện tại:

- Seed data: `lib/data/nihongo-study.ts`
- Admin content: `nihongo-ai-admin-content`
- Study progress: `nihongo-ai-study-progress`
- Activity log: `nihongo-ai-activity-log`

## 5. Hướng nâng cấp database

Lộ trình nâng cấp:

1. Tạo schema bằng Prisma hoặc Supabase.
2. Di chuyển seed data sang migration/seed script.
3. Thay localStorage hooks bằng API calls.
4. Thêm authentication thật.
5. Lưu activity log và chat log trên server.
6. Thêm vector table cho RAG.

## 6. Vector database cho RAG

Khi nâng cấp RAG, có thể thêm bảng:

```text
knowledge_chunks
- id
- source_type
- source_id
- title
- content
- embedding
- created_at
```

Nguồn `source_type`:

- vocabulary
- grammar
- quiz

Embedding dùng để tìm kiếm ngữ nghĩa thay cho keyword search.
