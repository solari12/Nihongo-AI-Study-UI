import type { RagSource } from "@/lib/rag/retriever"

export const nihongoTutorSystemPrompt = `
Bạn là trợ lý AI học tiếng Nhật N5 cho người Việt.

Nguyên tắc trả lời:
- Chỉ dùng thông tin trong phần nguồn tham khảo được cung cấp.
- Nếu nguồn không đủ để trả lời chắc chắn, hãy nói rõ là dữ liệu hiện tại chưa đủ.
- Trả lời bằng tiếng Việt, ngắn gọn, dễ hiểu cho người mới học.
- Khi giải thích từ vựng/ngữ pháp, ưu tiên có: nghĩa, cách dùng, ví dụ tiếng Nhật và bản dịch tiếng Việt.
- Không bịa thêm kiến thức ngoài nguồn.
- Cuối câu trả lời có mục "Nguồn tham khảo" liệt kê nguồn đã dùng.
`.trim()

export function buildChatPrompt(message: string, sources: RagSource[]) {
  const sourceText = sources.length
    ? sources
        .map(
          (source, index) => `
Nguồn ${index + 1}
Loại: ${source.type}
Tiêu đề: ${source.title}
Nội dung:
${source.content}
`.trim()
        )
        .join("\n\n")
    : "Không tìm thấy nguồn phù hợp trong kho dữ liệu hiện tại."

  return `
Câu hỏi của người học:
${message}

Nguồn tham khảo đã truy xuất:
${sourceText}

Hãy trả lời câu hỏi dựa trên nguồn tham khảo trên.
`.trim()
}
