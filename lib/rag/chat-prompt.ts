import type { RagSource } from "@/lib/rag/retriever"

export type ChatHistoryMessage = {
  role: "user" | "assistant"
  content: string
}

export type ActiveArticleContext = {
  title: string
  level: string
  category?: string | null
  articleText: string
  vocabulary?: string
  grammar?: string
  questions?: string
}

export const nihongoTutorSystemPrompt = `
Bạn là trợ lý AI học tiếng Nhật N5 cho người Việt trong ứng dụng Nihongo AI Study.

Nguyên tắc trả lời:
- Ưu tiên trả lời dựa trên nguồn RAG được cung cấp.
- Khi câu hỏi liên quan đến tình trạng học, mục tiêu thi, điểm yếu, hoặc "hôm nay nên học gì", hãy dùng các công cụ học tập có sẵn để xem hồ sơ, tiến độ, quiz, ngữ pháp, từ vựng và bài đọc trước khi lập kế hoạch.
- Các công cụ hiện tại chỉ được đọc dữ liệu, không tự ghi dữ liệu. Nếu muốn lưu ôn tập, tạo quiz hoặc ghi hoạt động, hãy đề xuất hành động để người học bấm xác nhận trong giao diện.
- Với kế hoạch thi JLPT, hãy trả lời theo mốc thời gian, ưu tiên học, lịch tuần/ngày, tiêu chí kiểm tra tiến bộ và rủi ro nếu thời gian học ít.
- Nếu nguồn chưa đủ, nói rõ phần nào chưa chắc chắn và đề xuất cách hỏi cụ thể hơn.
- Trả lời bằng tiếng Việt, ngắn gọn, có cấu trúc, phù hợp người mới học.
- Khi giải thích từ vựng, luôn ưu tiên: nghĩa, cách đọc, loại từ, ví dụ Nhật - Việt.
- Khi giải thích ngữ pháp, luôn ưu tiên: ý nghĩa, cấu trúc, cách dùng, ví dụ Nhật - Việt.
- Khi có câu tiếng Nhật, giữ nguyên chữ Nhật và giải thích bằng tiếng Việt.
- Luôn tạo câu trả lời hoàn chỉnh cho người học; không được chỉ liệt kê tiêu đề nguồn hoặc tên tool.
- Không bịa nguồn. Cuối câu trả lời có mục "Nguồn tham khảo" nếu có nguồn.
- Khi nguồn bài đọc/news có link nội bộ, chỉ đưa link nội bộ dạng Markdown [tên bài](/reading?article=<id>). Không đưa link TODAII/sourceUrl ra câu trả lời trừ khi người học yêu cầu link gốc. Tuyệt đối không viết thành https://reading?article=...
- Chỉ tạo quiz/trắc nghiệm khi người học yêu cầu rõ ràng. Nếu người học chỉ xin bài đọc, tóm tắt, từ vựng, ngữ pháp, hoặc link bài báo, không được tự sinh câu hỏi quiz.
- Nếu đã dùng công cụ, có thể thêm mục "Dữ liệu đã xem" ngắn gọn.
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
${source.href ? `Link nội bộ: ${source.href}` : ""}
Điểm khớp: ${source.score}
Nội dung:
${source.content}
`.trim()
    )
    .join("\n\n")
}

function formatActiveArticle(article: ActiveArticleContext | null | undefined) {
  if (!article) return ""

  return `
Bai bao dang active:
Tieu de: ${article.title}
Cap do: ${article.level}
Danh muc: ${article.category ?? "Khong ro"}

Noi dung bai bao:
${article.articleText}

Tu vung trong bai:
${article.vocabulary || "Khong co du lieu tu vung rieng."}

Ngu phap trong bai:
${article.grammar || "Khong co du lieu ngu phap rieng."}

Cau hoi co san trong bai:
${article.questions || "Khong co cau hoi co san."}

Quy tac khi co bai bao active:
- Neu nguoi hoc hoi "bai nay", "bai do", tom tat, tu kho, ngu phap, dich, giai thich doan, hoac tao bai tap/cau hoi, hay bam sat bai bao active nay.
- Khong tu chuyen sang nguon ngu phap/tu vung khac neu cau hoi van dang noi ve bai bao.
- Neu tao quiz, hay tao cau hoi doc hieu hoac cau hoi tu vung/ngu phap rut ra tu bai bao nay.
`.trim()
}

function quizUiFormatInstructions() {
  return `
Interactive quiz UI format:
If the current user asks for quiz, bai tap, luyen tap, thuc hanh, trac nghiem, chon dap an dung, or dien cau, output each question in this exact ASCII-friendly format so the chat UI can render choice cards.
Do not write a separate answer list, answer summary, or explanation preview before or after the cards. The UI will hide Dap an and Giai thich until the learner submits.
Use exactly A, B, C, D as option labels.
If the learner asks for a number of questions, output exactly that many questions. If no number is given for an exercise request, output exactly 5 questions.
Cau 1: <question>
A. <option>
B. <option>
C. <option>
D. <option>
Dap an: <A/B/C/D>
Giai thich: <short explanation>
`.trim()
}

export function buildChatPrompt(
  message: string,
  sources: RagSource[],
  history: ChatHistoryMessage[] = [],
  activeArticle?: ActiveArticleContext | null,
  projectContext = "",
  includeQuizInstructions = false
) {
  return `
Hội thoại gần đây:
${formatHistory(history)}

Câu hỏi hiện tại của người học:
${message}

${formatActiveArticle(activeArticle)}

${projectContext}

Nguồn tham khảo đã truy xuất:
${formatSources(sources)}

${includeQuizInstructions ? quizUiFormatInstructions() : ""}

Hãy trả lời câu hỏi hiện tại dựa trên nguồn tham khảo. Nếu nguồn không đủ, vẫn hỗ trợ người học bằng cách chỉ ra thiếu dữ liệu và gợi ý câu hỏi tốt hơn.
Không được trả lời chỉ bằng danh sách nguồn; phải giải thích trực tiếp câu hỏi của người học.
`.trim()
}
