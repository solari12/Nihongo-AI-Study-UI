# UML và sơ đồ luồng xử lý

Các sơ đồ dưới đây dùng Mermaid để có thể đưa trực tiếp vào báo cáo hoặc render trong Markdown viewer hỗ trợ Mermaid.

## 1. Use Case Diagram

```mermaid
flowchart LR
  Learner[Người học]
  Admin[Quản trị viên]

  Learner --> UC1[Học từ vựng]
  Learner --> UC2[Học ngữ pháp]
  Learner --> UC3[Làm quiz]
  Learner --> UC4[Xem lịch sử học]
  Learner --> UC5[Xem lộ trình gợi ý]
  Learner --> UC6[Hỏi chatbot AI]

  Admin --> UC7[Quản lý từ vựng]
  Admin --> UC8[Quản lý ngữ pháp]
  Admin --> UC9[Quản lý quiz]
  Admin --> UC10[Import/Export JSON]
```

## 2. Activity Diagram: Làm quiz

```mermaid
flowchart TD
  A[Bắt đầu quiz] --> B[Chọn loại quiz]
  B --> C[Trả lời từng câu hỏi]
  C --> D{Còn câu hỏi?}
  D -- Có --> C
  D -- Không --> E[Gửi đáp án]
  E --> F[API chấm điểm]
  F --> G[Lưu quiz attempt]
  G --> H[Ghi activity log]
  H --> I[Cập nhật recommendation]
  I --> J[Hiển thị kết quả]
```

## 3. Activity Diagram: Học từ vựng

```mermaid
flowchart TD
  A[Mở trang từ vựng] --> B[Tìm kiếm hoặc lọc chủ đề]
  B --> C[Chọn từ vựng]
  C --> D{Hành động}
  D -- Đánh dấu đã học --> E[Lưu learnedVocabularyIds]
  D -- Thêm ôn tập --> F[Lưu reviewVocabularyIds]
  E --> G[Ghi activity log]
  F --> G
  G --> H[Cập nhật dashboard/history/recommendation]
```

## 4. Sequence Diagram: Chatbot RAG

```mermaid
sequenceDiagram
  participant U as User
  participant UI as Chat UI
  participant API as /api/chat
  participant R as Retriever
  participant OR as OpenRouter

  U->>UI: Nhập câu hỏi
  UI->>API: POST message + admin content
  API->>R: retrieveSources(message)
  R-->>API: top relevant sources
  API->>API: buildChatPrompt(message, sources)
  API->>OR: chat completion request
  OR-->>API: answer
  API-->>UI: answer + sources
  UI-->>U: Hiển thị câu trả lời
```

## 5. Sequence Diagram: Recommendation

```mermaid
sequenceDiagram
  participant U as User
  participant UI as Learning UI
  participant P as Progress Store
  participant A as Activity Log
  participant E as Recommendation Engine

  U->>UI: Học từ / làm quiz
  UI->>P: Cập nhật progress
  UI->>A: Ghi activity
  UI->>E: generateRecommendations(progress, activities)
  E-->>UI: recommendations
  UI-->>U: Hiển thị lộ trình cá nhân hóa
```

## 6. Component Diagram

```mermaid
flowchart TB
  UI[Next.js UI]
  API[API Routes]
  Data[Seed Data + Admin Content]
  Progress[Progress Store]
  Activity[Activity Log]
  Reco[Recommendation Engine]
  RAG[RAG Retriever + Prompt Builder]
  LLM[OpenRouter LLM]

  UI --> API
  UI --> Progress
  UI --> Activity
  UI --> Data
  Progress --> Reco
  Activity --> Reco
  Data --> Reco
  API --> RAG
  RAG --> Data
  API --> LLM
```
