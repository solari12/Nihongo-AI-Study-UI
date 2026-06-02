import {
  grammarData,
  quizQuestions,
  vocabularyData,
  type GrammarItem,
  type QuizQuestionItem,
  type VocabularyItem,
} from "@/lib/data/nihongo-study"
import { prisma } from "@/lib/prisma"

export type RagSource = {
  id: string
  type: "vocabulary" | "grammar" | "quiz" | "news"
  title: string
  content: string
  score: number
}

const sourceTypeLabels: Record<RagSource["type"], string> = {
  vocabulary: "Từ vựng",
  grammar: "Ngữ pháp",
  quiz: "Quiz",
  news: "Bài đọc",
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\sぁ-んァ-ン一-龯]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function splitJapaneseCharacters(value: string) {
  return Array.from(value.matchAll(/[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]+/gu)).map(
    (match) => match[0]
  )
}

function tokenize(value: string) {
  const normalized = normalize(value)
  const wordTokens = normalized.split(" ").filter((token) => token.length >= 2)
  const japaneseTokens = splitJapaneseCharacters(value).filter((token) => token.length >= 1)

  return Array.from(new Set([normalized, ...wordTokens, ...japaneseTokens].filter(Boolean)))
}

function scoreSource(queryTokens: string[], searchableText: string) {
  const normalizedSearchable = normalize(searchableText)
  const rawSearchable = searchableText.toLowerCase()

  return queryTokens.reduce((score, token) => {
    if (!token) return score
    const normalizedToken = normalize(token)
    if (!normalizedToken) return score

    if (normalizedSearchable === normalizedToken || rawSearchable === token.toLowerCase()) return score + 12
    if (normalizedSearchable.includes(normalizedToken)) {
      return score + Math.min(8, Math.max(2, normalizedToken.length))
    }
    if (rawSearchable.includes(token.toLowerCase())) return score + 4

    return score
  }, 0)
}

function mapChunkType(sourceType: string): RagSource["type"] {
  if (sourceType === "grammar" || sourceType === "n5-grammar") return "grammar"
  if (sourceType === "quiz") return "quiz"
  if (sourceType === "todaii-news") return "news"
  return "vocabulary"
}

function vocabularyContent(item: VocabularyItem) {
  return [
    `Từ vựng: ${item.japanese}`,
    `Cách đọc: ${item.hiragana}`,
    `Romaji: ${item.romaji}`,
    `Nghĩa: ${item.vietnamese}`,
    `Loại từ: ${item.type}`,
    `Chủ đề: ${item.topic}`,
    `Ví dụ: ${item.example.japanese}`,
    item.example.hiragana ? `Đọc ví dụ: ${item.example.hiragana}` : null,
    `Dịch ví dụ: ${item.example.vietnamese}`,
  ]
    .filter(Boolean)
    .join("\n")
}

function grammarContent(item: GrammarItem) {
  return [
    `Ngữ pháp: ${item.pattern}`,
    `Ý nghĩa: ${item.meaning}`,
    `Cấu trúc: ${item.structure}`,
    `Ghi chú: ${item.usageNote}`,
    `Ví dụ: ${item.example.japanese}`,
    `Dịch ví dụ: ${item.example.vietnamese}`,
    `Độ khó: ${item.difficulty}`,
    `Trạng thái: ${item.status}`,
  ].join("\n")
}

function quizContent(item: QuizQuestionItem) {
  return [
    `Câu hỏi quiz: ${item.question}`,
    `Chủ đề: ${item.topic}`,
    `Loại: ${item.type}`,
    `Độ khó: ${item.difficulty}`,
    `Đáp án đúng: ${item.answers.find((answer) => answer.id === item.correctAnswer)?.text ?? item.correctAnswer}`,
    `Giải thích: ${item.explanation}`,
  ].join("\n")
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
      const content = vocabularyContent(item)

      return {
        id: `vocabulary-${item.id}`,
        type: "vocabulary" as const,
        title: `${item.japanese} (${item.vietnamese})`,
        content,
        score: scoreSource(queryTokens, `${item.japanese}\n${item.hiragana}\n${item.romaji}\n${content}`),
      }
    }),
    ...grammarItems.map((item) => {
      const content = grammarContent(item)

      return {
        id: `grammar-${item.id}`,
        type: "grammar" as const,
        title: item.pattern,
        content,
        score: scoreSource(queryTokens, `${item.pattern}\n${item.meaning}\n${content}`),
      }
    }),
    ...quizItems.map((item) => {
      const content = quizContent(item)

      return {
        id: `quiz-${item.id}`,
        type: "quiz" as const,
        title: item.question,
        content,
        score: scoreSource(queryTokens, `${item.question}\n${item.topic}\n${content}`),
      }
    }),
  ]

  return sources
    .filter((source) => source.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

export async function retrieveSourcesFromDatabase(query: string, limit = 6): Promise<RagSource[]> {
  const queryTokens = tokenize(query)
  if (!queryTokens.length) return []

  const chunks = await prisma.knowledgeChunk.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 1000,
  })

  return chunks
    .map((chunk) => ({
      id: chunk.id,
      type: mapChunkType(chunk.sourceType),
      title: chunk.title,
      content: chunk.content,
      score: scoreSource(queryTokens, `${chunk.title}\n${chunk.sourceType}\n${chunk.content}`),
    }))
    .filter((source) => source.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

export function buildFallbackAnswer(message: string, sources: RagSource[]) {
  if (!sources.length) {
    return [
      "Mình chưa tìm thấy dữ liệu phù hợp trong kho học hiện tại.",
      "",
      `Câu hỏi của bạn: ${message}`,
      "",
      "Bạn có thể hỏi cụ thể hơn bằng tiếng Nhật, hiragana, romaji hoặc tiếng Việt.",
      "Ví dụ: \"学生 nghĩa là gì?\", \"Giải thích N は N です\", hoặc \"Bài đọc N5 nào có từ 食べる?\".",
    ].join("\n")
  }

  const topSource = sources[0]
  const otherSources = sources.slice(1, 4)

  return [
    `Mình tìm thấy nguồn phù hợp nhất: ${topSource.title}.`,
    "",
    topSource.content,
    "",
    "Cách học tiếp:",
    "- Đọc lại ví dụ tiếng Nhật.",
    "- Tự đặt 1 câu tương tự.",
    "- Hỏi tiếp nếu bạn muốn mình tách nghĩa từng phần.",
    "",
    "Nguồn tham khảo:",
    `- ${sourceTypeLabels[topSource.type]}: ${topSource.title}`,
    ...otherSources.map((source) => `- ${sourceTypeLabels[source.type]}: ${source.title}`),
  ].join("\n")
}
