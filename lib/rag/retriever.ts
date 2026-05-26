import {
  grammarData,
  quizQuestions,
  vocabularyData,
  type GrammarItem,
  type QuizQuestionItem,
  type VocabularyItem,
} from "@/lib/data/nihongo-study"

export type RagSource = {
  id: string
  type: "vocabulary" | "grammar" | "quiz"
  title: string
  content: string
  score: number
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\sぁ-んァ-ン一-龯]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function tokenize(value: string) {
  const normalized = normalize(value)
  const tokens = normalized.split(" ").filter((token) => token.length >= 2)

  return Array.from(new Set([normalized, ...tokens].filter(Boolean)))
}

function scoreSource(queryTokens: string[], searchableText: string) {
  const normalizedSearchable = normalize(searchableText)

  return queryTokens.reduce((score, token) => {
    if (!token) return score
    if (normalizedSearchable === token) return score + 8
    if (normalizedSearchable.includes(token)) return score + Math.min(6, Math.max(2, token.length))
    return score
  }, 0)
}

export function retrieveSources(
  query: string,
  limit = 5,
  content: {
    vocabulary?: VocabularyItem[]
    grammar?: GrammarItem[]
    quiz?: QuizQuestionItem[]
  } = {}
): RagSource[] {
  const queryTokens = tokenize(query)
  if (!queryTokens.length) return []
  const vocabularyItems = content.vocabulary ?? vocabularyData
  const grammarItems = content.grammar ?? grammarData
  const quizItems = content.quiz ?? quizQuestions

  const sources: RagSource[] = [
    ...vocabularyItems.map((item) => {
      const content = [
        `Từ vựng: ${item.japanese}`,
        `Hiragana: ${item.hiragana}`,
        `Romaji: ${item.romaji}`,
        `Nghĩa: ${item.vietnamese}`,
        `Loại từ: ${item.type}`,
        `Chủ đề: ${item.topic}`,
        `Ví dụ: ${item.example.japanese} = ${item.example.vietnamese}`,
      ].join("\n")

      return {
        id: `vocabulary-${item.id}`,
        type: "vocabulary" as const,
        title: `${item.japanese} (${item.vietnamese})`,
        content,
        score: scoreSource(queryTokens, content),
      }
    }),
    ...grammarItems.map((item) => {
      const content = [
        `Ngữ pháp: ${item.pattern}`,
        `Ý nghĩa: ${item.meaning}`,
        `Cấu trúc: ${item.structure}`,
        `Ghi chú: ${item.usageNote}`,
        `Ví dụ: ${item.example.japanese} = ${item.example.vietnamese}`,
        `Độ khó: ${item.difficulty}`,
      ].join("\n")

      return {
        id: `grammar-${item.id}`,
        type: "grammar" as const,
        title: item.pattern,
        content,
        score: scoreSource(queryTokens, content),
      }
    }),
    ...quizItems.map((item) => {
      const content = [
        `Quiz: ${item.question}`,
        `Chủ đề: ${item.topic}`,
        `Loại: ${item.type}`,
        `Đáp án đúng: ${item.answers.find((answer) => answer.id === item.correctAnswer)?.text ?? item.correctAnswer}`,
        `Giải thích: ${item.explanation}`,
      ].join("\n")

      return {
        id: `quiz-${item.id}`,
        type: "quiz" as const,
        title: item.question,
        content,
        score: scoreSource(queryTokens, content),
      }
    }),
  ]

  return sources
    .filter((source) => source.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

export function buildFallbackAnswer(message: string, sources: RagSource[]) {
  if (!sources.length) {
    return [
      "Mình chưa tìm thấy dữ liệu phù hợp trong kho N5 hiện tại.",
      "",
      `Câu hỏi của bạn: ${message}`,
      "",
      "Bạn có thể thử hỏi rõ hơn bằng từ khóa tiếng Nhật, hiragana, romaji hoặc tiếng Việt. Ví dụ: \"学生 nghĩa là gì?\" hoặc \"Giải thích N は N です\".",
    ].join("\n")
  }

  const topSource = sources[0]
  return [
    `Mình tìm thấy nội dung liên quan nhất: ${topSource.title}.`,
    "",
    topSource.content,
    "",
    "Gợi ý học tiếp: đọc ví dụ, tự đặt thêm 1 câu tương tự, rồi làm quiz để kiểm tra lại.",
    "",
    `Nguồn dùng để trả lời: ${sources.map((source) => source.title).join(", ")}.`,
  ].join("\n")
}
