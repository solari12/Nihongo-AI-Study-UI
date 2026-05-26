# RAG Chatbot cho Nihongo AI Study

## 1. Mục tiêu

Chatbot trong Nihongo AI Study có nhiệm vụ hỗ trợ người học tiếng Nhật sơ cấp/N5 bằng cách trả lời câu hỏi về từ vựng, ngữ pháp và bài luyện tập dựa trên dữ liệu học tập có sẵn trong hệ thống.

Thay vì để mô hình ngôn ngữ tự trả lời hoàn toàn từ kiến thức nội tại, hệ thống áp dụng hướng Retrieval-Augmented Generation (RAG): trước khi sinh câu trả lời, hệ thống tìm các nội dung liên quan trong kho dữ liệu học tập, sau đó đưa các nội dung này vào prompt để mô hình trả lời có căn cứ hơn.

## 2. Nguồn dữ liệu

Nguồn dữ liệu ban đầu lấy từ các module nội dung của ứng dụng:

- Vocabulary: từ tiếng Nhật, hiragana, romaji, nghĩa tiếng Việt, loại từ, chủ đề và ví dụ.
- Grammar: mẫu câu, ý nghĩa, cấu trúc, ghi chú sử dụng, độ khó và ví dụ.
- Quiz: câu hỏi, các đáp án, đáp án đúng, giải thích, chủ đề và độ khó.

Trong phiên bản hiện tại, admin có thể quản lý nội dung qua giao diện Admin. Dữ liệu được lưu trong localStorage và có thể import/export dưới dạng JSON. Khi nâng cấp lên backend thật, các nguồn dữ liệu này có thể chuyển sang database như PostgreSQL, SQLite hoặc Supabase.

## 3. Luồng xử lý RAG

Luồng xử lý chatbot gồm 4 bước:

1. User gửi câu hỏi, ví dụ: "Giải thích mẫu N は N です".
2. Retriever tìm các mục liên quan trong vocabulary, grammar và quiz.
3. Hệ thống tạo prompt gồm câu hỏi của user và các nguồn đã tìm được.
4. Generator tạo câu trả lời và trả về kèm danh sách nguồn tham khảo.

Sơ đồ logic:

```text
User question
  -> Query preprocessing
  -> Retriever
  -> Top relevant sources
  -> Prompt construction
  -> LLM / template generator
  -> Answer + sources
```

## 4. Retrieval

Ở giai đoạn MVP, retriever có thể dùng keyword search thay vì vector database. Hệ thống chuẩn hóa câu hỏi và nội dung về chữ thường, sau đó so khớp theo các trường:

- japanese
- hiragana
- romaji
- vietnamese
- pattern
- meaning
- structure
- usageNote
- topic

Mỗi nguồn được gán điểm liên quan dựa trên số lượng từ khóa trùng khớp. Các nguồn có điểm cao nhất được chọn đưa vào prompt.

Ví dụ source trả về:

```ts
{
  id: "grammar-1",
  type: "grammar",
  title: "N は N です",
  content: "Cấu trúc: Danh từ 1 + は + Danh từ 2 + です...",
  score: 8
}
```

Ưu điểm của keyword retrieval:

- Dễ triển khai.
- Dễ giải thích trong báo cáo.
- Phù hợp với dữ liệu nhỏ và có cấu trúc rõ ràng.

Hạn chế:

- Khó bắt được câu hỏi đồng nghĩa.
- Không hiểu ngữ nghĩa sâu.
- Phụ thuộc nhiều vào từ khóa người dùng nhập.

## 5. Generation với OpenRouter

Có thể dùng OpenRouter làm gateway gọi LLM vì OpenRouter hỗ trợ endpoint chat completions tương thích với định dạng OpenAI.

Theo tài liệu OpenRouter, endpoint tạo chat completion là:

```text
POST https://openrouter.ai/api/v1/chat/completions
```

Header chính:

```text
Authorization: Bearer <OPENROUTER_API_KEY>
Content-Type: application/json
```

OpenRouter cũng hỗ trợ header attribution để định danh ứng dụng:

```text
HTTP-Referer: http://localhost:3000
X-OpenRouter-Title: Nihongo AI Study
```

Ví dụ request:

```ts
await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    "X-OpenRouter-Title": "Nihongo AI Study",
  },
  body: JSON.stringify({
    model: process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini",
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content:
          "Bạn là trợ lý học tiếng Nhật N5. Chỉ trả lời dựa trên nguồn được cung cấp. Nếu không đủ nguồn, hãy nói rõ.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  }),
})
```

Biến môi trường đề xuất:

```env
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openai/gpt-4o-mini
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Trong trường hợp chưa có API key hoặc request lỗi, hệ thống nên fallback sang template answer để demo vẫn chạy được.

## 6. Prompt construction

Prompt nên có cấu trúc rõ ràng:

```text
Câu hỏi của người học:
{userMessage}

Nguồn tham khảo:
1. [Grammar] N は N です
   Ý nghĩa: N là N
   Cấu trúc: Danh từ 1 + は + Danh từ 2 + です
   Ví dụ: 私は学生です。= Tôi là sinh viên.

Yêu cầu:
- Trả lời bằng tiếng Việt.
- Phù hợp trình độ N5.
- Có ví dụ tiếng Nhật, romaji nếu cần.
- Không bịa nội dung ngoài nguồn.
- Cuối câu trả lời nêu nguồn đã dùng.
```

## 7. Response format

API chatbot nên trả về:

```ts
{
  answer: string
  sources: {
    id: string
    type: "vocabulary" | "grammar" | "quiz"
    title: string
    score: number
  }[]
}
```

Trên UI, câu trả lời được hiển thị trong khung chat, còn sources hiển thị ở sidebar hoặc dưới mỗi message.

## 8. Đánh giá chatbot

Có thể đánh giá chatbot theo các tiêu chí:

- Độ liên quan: câu trả lời có đúng với câu hỏi không.
- Độ chính xác: câu trả lời có đúng theo dữ liệu học tập không.
- Tính dễ hiểu: câu trả lời có phù hợp người học N5 không.
- Khả năng trích dẫn nguồn: có hiển thị nguồn từ vựng/ngữ pháp/quiz được dùng không.

Ví dụ bộ test:

```text
1. Giải thích N は N です
2. 学生 nghĩa là gì?
3. Phân biệt これ và それ
4. Tạo ví dụ với 水
5. Tôi sai nhiều trợ từ は, nên ôn gì?
```

## 9. Hạn chế của MVP

Phiên bản MVP có một số hạn chế:

- Chưa dùng embedding nên khả năng tìm kiếm ngữ nghĩa còn hạn chế.
- Chưa có vector database.
- Chưa đánh giá tự động chất lượng câu trả lời.
- Nếu dùng template fallback, câu trả lời chưa linh hoạt như LLM thật.
- Nếu dùng OpenRouter, hệ thống phụ thuộc API key, quota và model được chọn.

## 10. Hướng nâng cấp

Các hướng nâng cấp sau phù hợp cho giai đoạn tiếp theo:

1. Dùng embedding để chuyển nội dung học tập thành vector.
2. Lưu vector vào vector database như Supabase Vector, Pinecone, Qdrant hoặc Chroma.
3. Dùng hybrid search: keyword search + vector search.
4. Thêm reranking để chọn nguồn tốt hơn.
5. Ghi log câu hỏi chatbot để phân tích nhu cầu người học.
6. Tích hợp hệ khuyến nghị: nếu chatbot phát hiện người học yếu chủ đề nào, hệ thống thêm chủ đề đó vào learning path.
7. Thêm evaluation set để đo độ chính xác chatbot qua các câu hỏi mẫu.

## 11. Vai trò trong hệ thống

RAG chatbot kết hợp với recommendation engine tạo thành hai thành phần AI chính của hệ thống:

- Chatbot RAG: hỗ trợ hỏi đáp trực tiếp dựa trên dữ liệu học tập.
- Recommendation engine: phân tích lịch sử học và kết quả quiz để đề xuất lộ trình học.

Hai thành phần này dùng chung dữ liệu nền gồm vocabulary, grammar, quiz và activity log, giúp hệ thống vừa hỗ trợ tức thời vừa cá nhân hóa quá trình học lâu dài.

## 12. Tài liệu tham khảo

- OpenRouter Chat Completion API: https://openrouter.ai/docs/api-reference/chat-completion
- OpenRouter App Attribution: https://openrouter.ai/docs/app-attribution
- Retrieval-Augmented Generation: Lewis et al., 2020.
- Vector search và embedding có thể triển khai bằng Supabase Vector, Qdrant, Pinecone hoặc Chroma.
