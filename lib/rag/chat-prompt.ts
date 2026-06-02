import type { RagSource } from "@/lib/rag/retriever"

export type ChatHistoryMessage = {
  role: "user" | "assistant"
  content: string
}

export const nihongoTutorSystemPrompt = `
Bạn là trợ lý AI học tiếng Nhật N5 cho người Việt trong ứng dụng Nihongo AI Study.

Nguyên tắc trả lời:
- Ưu tiên trả lời dựa trên nguồn RAG được cung cấp.
- Nếu nguồn chưa đủ, nói rõ phần nào chưa chắc chắn và đề xuất cách hỏi cụ thể hơn.
- Trả lời bằng tiếng Việt, ngắn gọn, có cấu trúc, phù hợp người mới học.
- Khi giải thích từ vựng, luôn ưu tiên: nghĩa, cách đọc, loại từ, ví dụ Nhật - Việt.
- Khi giải thích ngữ pháp, luôn ưu tiên: ý nghĩa, cấu trúc, cách dùng, ví dụ Nhật - Việt.
- Khi có câu tiếng Nhật, giữ nguyên chữ Nhật và giải thích bằng tiếng Việt.
- Không bịa nguồn. Cuối câu trả lời có mục "Nguồn tham khảo" nếu có nguồn.
`.trim()

function formatHistory(history: ChatHistoryMessage[]) {
  if (!history.length) return "Chưa có hội thoại trước đó."

  return history
    .slice(-6)
    .map((item) => `${item.role === "user" ? "Người học" : "Trợ lý"}: ${item.content}`)
    .join("\n")
}

function formatSources(sources: RagSource[]) {
  if (!sources.length) {
    return "Không tìm thấy nguồn phù hợp trong kho dữ liệu hiện tại."
  }

  return sources
    .map(
      (source, index) => `
Nguồn ${index + 1}
Loại: ${source.type}
Tiêu đề: ${source.title}
Điểm khớp: ${source.score}
Nội dung:
${source.content}
`.trim()
    )
    .join("\n\n")
}

export function buildChatPrompt(message: string, sources: RagSource[], history: ChatHistoryMessage[] = []) {
  return `
Hội thoại gần đây:
${formatHistory(history)}

Câu hỏi hiện tại của người học:
${message}

Nguồn tham khảo đã truy xuất:
${formatSources(sources)}

Hãy trả lời câu hỏi hiện tại dựa trên nguồn tham khảo. Nếu nguồn không đủ, vẫn hỗ trợ người học bằng cách chỉ ra thiếu dữ liệu và gợi ý câu hỏi tốt hơn.
`.trim()
}
