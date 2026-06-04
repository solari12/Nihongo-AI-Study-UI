# RAG Chatbot cho Nihongo AI Study

## Mục tiêu

Chatbot hỗ trợ người học tiếng Nhật N5 bằng tiếng Việt. Câu trả lời ưu tiên dựa trên dữ liệu nội bộ gồm từ vựng, ngữ pháp, quiz và bài đọc/TODAII đã import.

Theo PRD, pipeline RAG gồm:

```text
Dữ liệu học tập
  -> tiền xử lý thành knowledge chunks
  -> sinh embedding vector
  -> lưu vector trong PostgreSQL
  -> truy xuất top-k nguồn bằng vector similarity
  -> đưa nguồn vào prompt
  -> LLM sinh câu trả lời có căn cứ
```

## Trạng thái triển khai theo PRD

- API chính: `POST /api/chat`.
- Bảng tri thức: `knowledge_chunks`.
- Trường vector: `knowledge_chunks.embedding` dạng JSON number array.
- Script sinh vector: `pnpm data:generate:embeddings`.
- Retriever chính: `retrieveSourcesFromDatabase`.
- Vector scoring: cosine similarity giữa embedding câu hỏi và embedding từng chunk.
- Keyword scoring: fallback/kết hợp khi thiếu API key, thiếu embedding hoặc cần boost theo intent.

PostgreSQL trong bản đồ án đóng vai trò vector database ở mức ứng dụng: embedding được lưu trực tiếp trong bảng `knowledge_chunks` và được tính cosine similarity trong backend. Hướng này bám PRD nhưng không yêu cầu cài extension `pgvector` trên Windows khi demo. Nếu cần tối ưu hiệu năng cho dữ liệu lớn, có thể nâng cấp sang `pgvector` mà không đổi mô hình dữ liệu cốt lõi.

## Cấu hình embedding

Biến môi trường:

```env
OPENROUTER_API_KEY=
OPENAI_EMBEDDING_MODEL=openai/text-embedding-3-small
OPENAI_EMBEDDING_MAX_CHARS=6000
```

Lệnh tạo embedding:

```bash
pnpm data:generate:embeddings
```

Script sẽ cắt nội dung quá dài theo `OPENAI_EMBEDDING_MAX_CHARS` trước khi gọi embedding API để tránh vượt giới hạn context của model. Với bài đọc/TODAII dài, phần tiêu đề, source type và đoạn đầu nội dung vẫn được giữ trong vector đại diện.

Quy trình chuẩn trước demo:

```bash
pnpm db:migrate
pnpm db:seed
pnpm data:generate:embeddings
pnpm build
```

Nếu dùng OpenAI trực tiếp thay vì OpenRouter, có thể dùng:

```env
OPENAI_API_KEY=
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_EMBEDDING_BASE_URL=https://api.openai.com/v1/embeddings
```

Nếu chưa có `OPENROUTER_API_KEY` hoặc `OPENAI_API_KEY`, app vẫn chạy bằng keyword fallback để tránh crash, nhưng báo cáo/bảo vệ nên dùng database đã có embedding để chứng minh pipeline RAG đầy đủ.

## Bộ câu hỏi đánh giá RAG

| Câu hỏi | Nguồn mong đợi | Kết quả mong đợi |
|---|---|---|
| `学生 nghĩa là gì?` | Vocabulary `学生` | Trả nghĩa, cách đọc, ví dụ và nguồn từ vựng |
| `Giải thích N は N です` | Grammar pattern tương ứng | Trả ý nghĩa, cấu trúc, ví dụ Nhật - Việt |
| `Tạo 5 câu quiz từ vựng N5` | Vocabulary/quiz sources | Trả đúng format quiz A/B/C/D có đáp án và giải thích |
| `Bài đọc N5 nào có từ 食べる?` | News/reading nếu đã import | Trả link nội bộ `/reading?article=<id>` nếu có |
| `Một chủ đề không có trong dữ liệu` | Không có source phù hợp | Nói rõ chưa đủ dữ liệu, gợi ý hỏi cụ thể hơn |

## Giới hạn và hướng nâng cấp

- Bản hiện tại lưu vector bằng JSON và tính cosine trong app, phù hợp quy mô dữ liệu đồ án.
- Với dữ liệu lớn, nâng cấp sang `pgvector` để query similarity trực tiếp trong PostgreSQL.
- Có thể bổ sung benchmark top-k để so sánh keyword, vector và hybrid retrieval.
