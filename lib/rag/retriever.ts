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

type DbVocabularyMatch = {
  id: number
  japanese: string
  hiragana: string
  romaji: string
  vietnamese: string
  type: string
  topic: string
  exampleJapanese: string
  exampleVietnamese: string
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\sぁ-んァ-ン一-龯]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function splitJapaneseTerms(value: string) {
  return Array.from(value.matchAll(/[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]+/gu)).map(
    (match) => match[0]
  )
}

function tokenize(value: string) {
  const normalized = normalize(value)
  const wordTokens = normalized.split(" ").filter((token) => token.length >= 2)
  const japaneseTokens = splitJapaneseTerms(value).filter((token) => token.length >= 1)

  return Array.from(new Set([normalized, ...wordTokens, ...japaneseTokens].filter(Boolean)))
}

function isVocabularyMeaningQuery(query: string) {
  const normalized = normalize(query)
  return (
    /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u.test(query) &&
    (normalized.includes("nghĩa") ||
      normalized.includes("nghia") ||
      normalized.includes("la gi") ||
      normalized.includes("là gì") ||
      normalized.includes("mean") ||
      normalized.includes("means"))
  )
}

function isQuizIntent(query: string) {
  const normalized = normalize(query)
  return normalized.includes("quiz") || normalized.includes("kiểm tra") || normalized.includes("dap an")
}

function typeBoost(type: RagSource["type"], query: string) {
  if (isVocabularyMeaningQuery(query)) {
    if (type === "vocabulary") return 40
    if (type === "quiz") return -10
  }

  if (isQuizIntent(query)) {
    if (type === "quiz") return 20
  }

  return 0
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

function sortSources(sources: RagSource[], query: string, limit: number) {
  return sources
    .filter((source) => source.score > 0)
    .sort((a, b) => b.score + typeBoost(b.type, query) - (a.score + typeBoost(a.type, query)))
    .slice(0, limit)
}

function mapChunkType(sourceType: string): RagSource["type"] {
  if (sourceType === "grammar" || sourceType === "n5-grammar") return "grammar"
  if (sourceType === "quiz") return "quiz"
  if (sourceType === "todaii-news") return "news"
  return "vocabulary"
}

function vocabularyContent(item: VocabularyItem | DbVocabularyMatch) {
  const exampleJapanese =
    "example" in item ? item.example.japanese : item.exampleJapanese
  const exampleVietnamese =
    "example" in item ? item.example.vietnamese : item.exampleVietnamese
  const exampleReading =
    "example" in item && item.example.hiragana ? item.example.hiragana : null

  return [
    `Từ vựng: ${item.japanese}`,
    `Cách đọc: ${item.hiragana}`,
    `Romaji: ${item.romaji}`,
    `Nghĩa: ${item.vietnamese}`,
    `Loại từ: ${item.type}`,
    `Chủ đề: ${item.topic}`,
    `Ví dụ: ${exampleJapanese}`,
    exampleReading ? `Đọc ví dụ: ${exampleReading}` : null,
    `Dịch ví dụ: ${exampleVietnamese}`,
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

function sourceFromDbVocabulary(item: DbVocabularyMatch, queryTokens: string[]): RagSource {
  const content = vocabularyContent(item)
  const exactJapaneseMatch = queryTokens.includes(item.japanese)
  const exactReadingMatch = queryTokens.includes(item.hiragana) || queryTokens.includes(item.romaji.toLowerCase())

  return {
    id: `vocabulary-${item.id}`,
    type: "vocabulary",
    title: `${item.japanese} (${item.hiragana})`,
    content,
    score:
      scoreSource(queryTokens, `${item.japanese}\n${item.hiragana}\n${item.romaji}\n${item.vietnamese}\n${content}`) +
      (exactJapaneseMatch ? 30 : 0) +
      (exactReadingMatch ? 16 : 0),
  }
}

async function retrieveVocabularyMatchesFromDatabase(query: string, queryTokens: string[]) {
  const japaneseTerms = splitJapaneseTerms(query)
  const normalizedTokens = queryTokens.map(normalize).filter(Boolean)
  const lookupTerms = Array.from(new Set([...japaneseTerms, ...normalizedTokens])).filter((term) => term.length >= 1)

  if (!lookupTerms.length) return []

  const vocabulary = await prisma.vocabulary.findMany({
    where: {
      OR: lookupTerms.flatMap((term) => [
        { japanese: { contains: term } },
        { hiragana: { contains: term } },
        { romaji: { contains: term } },
        { vietnamese: { contains: term } },
      ]),
    },
    take: 30,
  })

  return vocabulary.map((item) => sourceFromDbVocabulary(item, queryTokens))
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

  return sortSources(sources, query, limit)
}

export async function retrieveSourcesFromDatabase(query: string, limit = 6): Promise<RagSource[]> {
  const queryTokens = tokenize(query)
  if (!queryTokens.length) return []

  const [vocabularySources, chunks] = await Promise.all([
    retrieveVocabularyMatchesFromDatabase(query, queryTokens),
    prisma.knowledgeChunk.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 1000,
    }),
  ])

  const chunkSources = chunks.map((chunk) => ({
    id: chunk.id,
    type: mapChunkType(chunk.sourceType),
    title: chunk.title,
    content: chunk.content,
    score: scoreSource(queryTokens, `${chunk.title}\n${chunk.sourceType}\n${chunk.content}`),
  }))

  const deduped = new Map<string, RagSource>()

  for (const source of [...vocabularySources, ...chunkSources]) {
    const existing = deduped.get(source.id)
    if (!existing || existing.score < source.score) {
      deduped.set(source.id, source)
    }
  }

  return sortSources(Array.from(deduped.values()), query, limit)
}

function lineValue(content: string, label: string) {
  const line = content
    .split("\n")
    .find((item) => normalize(item).startsWith(normalize(label)))

  return line?.slice(line.indexOf(":") + 1).trim() ?? ""
}

function renderVocabularyFallback(source: RagSource) {
  const japanese = lineValue(source.content, "Từ vựng")
  const reading = lineValue(source.content, "Cách đọc")
  const romaji = lineValue(source.content, "Romaji")
  const meaning = lineValue(source.content, "Nghĩa")
  const wordType = lineValue(source.content, "Loại từ")
  const example = lineValue(source.content, "Ví dụ")
  const translatedExample = lineValue(source.content, "Dịch ví dụ")

  return [
    `${japanese || source.title} nghĩa là ${meaning || "mình chưa có nghĩa tiếng Việt rõ trong dữ liệu"}.`,
    "",
    reading || romaji ? `Cách đọc: ${reading}${romaji ? ` (${romaji})` : ""}` : null,
    wordType ? `Loại từ: ${wordType}` : null,
    example ? `Ví dụ: ${example}` : null,
    translatedExample ? `Dịch: ${translatedExample}` : null,
  ]
    .filter(Boolean)
    .join("\n")
}

function renderGrammarFallback(source: RagSource) {
  const meaning = lineValue(source.content, "Ý nghĩa")
  const structure = lineValue(source.content, "Cấu trúc")
  const note = lineValue(source.content, "Ghi chú")
  const example = lineValue(source.content, "Ví dụ")
  const translatedExample = lineValue(source.content, "Dịch ví dụ")

  return [
    `${source.title}${meaning ? `: ${meaning}` : ""}`,
    "",
    structure ? `Cấu trúc: ${structure}` : null,
    note ? `Cách dùng: ${note}` : null,
    example ? `Ví dụ: ${example}` : null,
    translatedExample ? `Dịch: ${translatedExample}` : null,
  ]
    .filter(Boolean)
    .join("\n")
}

function renderQuizFallback(source: RagSource) {
  const answer = lineValue(source.content, "Đáp án đúng") || lineValue(source.content, "Correct answer")
  const explanation = lineValue(source.content, "Giải thích") || lineValue(source.content, "Explanation")

  return [
    `Mình tìm thấy một câu quiz liên quan: ${source.title}`,
    answer ? `Đáp án đúng: ${answer}` : null,
    explanation ? `Giải thích: ${explanation}` : null,
  ]
    .filter(Boolean)
    .join("\n")
}

function renderTopSource(source: RagSource) {
  if (source.type === "vocabulary") return renderVocabularyFallback(source)
  if (source.type === "grammar") return renderGrammarFallback(source)
  if (source.type === "quiz") return renderQuizFallback(source)
  return source.content
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
    renderTopSource(topSource),
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
