import {
  grammarData,
  quizQuestions,
  vocabularyData,
  type GrammarItem,
  type QuizQuestionItem,
  type VocabularyItem,
} from "@/lib/data/nihongo-study"
import { createEmbedding, cosineSimilarity, hasEmbeddingProvider, isEmbeddingVector } from "@/lib/rag/embeddings"
import { prisma } from "@/lib/prisma"

export type RagSource = {
  id: string
  sourceId?: string
  type: "vocabulary" | "grammar" | "quiz" | "news"
  title: string
  href?: string
  content: string
  score: number
}

type RetrieveSourcesOptions = {
  preferredTypes?: RagSource["type"][]
  requireTypes?: RagSource["type"][]
  requireJapaneseTermMatch?: boolean
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
    .replace(/[^\p{L}\p{N}\s\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function compact(value: string) {
  return normalize(value).replace(/\s+/g, "")
}

function splitJapaneseTerms(value: string) {
  return Array.from(value.matchAll(/[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]+/gu)).map(
    (match) => match[0]
  )
}

function tokenize(value: string) {
  const expandedValue = expandSearchText(value)
  const normalized = normalize(expandedValue)
  const wordTokens = normalized.split(" ").filter((token) => token.length >= 2)
  const japaneseTokens = splitJapaneseTerms(expandedValue).filter((token) => token.length >= 1)

  return Array.from(new Set([normalized, ...wordTokens, ...japaneseTokens].filter(Boolean)))
}

function expandSearchText(value: string) {
  const normalized = normalize(value)
  const additions: string[] = []

  if (normalized.includes("world cup") || normalized.includes("worldcup")) {
    additions.push("ワールドカップ", "W杯")
  }

  return additions.length ? `${value} ${additions.join(" ")}` : value
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

function isGrammarIntent(query: string) {
  const normalized = normalize(query)
  return (
    normalized.includes("giải thích") ||
    normalized.includes("giai thich") ||
    normalized.includes("mẫu câu") ||
    normalized.includes("mau cau") ||
    normalized.includes("ngữ pháp") ||
    normalized.includes("ngu phap") ||
    normalized.includes("cấu trúc") ||
    normalized.includes("cau truc") ||
    /[~〜]/.test(query) ||
    query.includes(" は ") ||
    query.includes(" が ") ||
    query.includes(" を ") ||
    query.includes(" に ") ||
    query.includes(" です")
  )
}

function typeBoost(type: RagSource["type"], query: string, options: RetrieveSourcesOptions = {}) {
  if (options.preferredTypes?.includes(type)) return 80

  if (isVocabularyMeaningQuery(query)) {
    if (type === "vocabulary") return 40
    if (type === "quiz") return -10
  }

  if (isGrammarIntent(query)) {
    if (type === "grammar") return 45
    if (type === "vocabulary") return -8
    if (type === "news") return -8
  }

  if (isQuizIntent(query) && type === "quiz") return 20

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

function sourceMatchesJapaneseTerms(query: string, source: RagSource) {
  const terms = splitJapaneseTerms(query)
  if (!terms.length) return true

  const searchableText = `${source.title}\n${source.content}`
  const variants = terms.flatMap((term) => {
    if (term.endsWith("る") && term.length > 1) return [term, term.slice(0, -1)]
    return [term]
  })

  return variants.some((term) => searchableText.includes(term))
}

function sortSources(sources: RagSource[], query: string, limit: number, options: RetrieveSourcesOptions = {}) {
  const requiredTypes = new Set(options.requireTypes ?? [])

  return sources
    .filter((source) => source.score > 0)
    .filter((source) => !requiredTypes.size || requiredTypes.has(source.type))
    .filter((source) => !options.requireJapaneseTermMatch || sourceMatchesJapaneseTerms(query, source))
    .sort((a, b) => b.score + typeBoost(b.type, query, options) - (a.score + typeBoost(a.type, query, options)))
    .slice(0, limit)
}

function isInternalTestNewsSource(source: RagSource) {
  if (source.type !== "news") return false
  const searchable = normalize(`${source.title}\n${source.content.slice(0, 1000)}`)

  return (
    /\btest\b/.test(normalize(source.title)) ||
    /\blocal\b/.test(normalize(source.title)) ||
    /\bimport\b/.test(normalize(source.title)) ||
    searchable.includes("test local") ||
    searchable.includes("local import") ||
    searchable.includes("test import")
  )
}

function mapChunkType(sourceType: string): RagSource["type"] {
  if (sourceType === "grammar" || sourceType === "n5-grammar") return "grammar"
  if (sourceType === "quiz") return "quiz"
  if (sourceType === "todaii-news") return "news"
  return "vocabulary"
}

function vocabularyContent(item: VocabularyItem | DbVocabularyMatch) {
  const exampleJapanese = "example" in item ? item.example.japanese : item.exampleJapanese
  const exampleVietnamese = "example" in item ? item.example.vietnamese : item.exampleVietnamese
  const exampleReading = "example" in item && item.example.hiragana ? item.example.hiragana : null

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
  const compactQuery = compact(query)

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
      const exactPatternBonus = compactQuery.includes(compact(item.pattern)) ? 50 : 0

      return {
        id: `grammar-${item.id}`,
        type: "grammar" as const,
        title: item.pattern,
        content,
        score: scoreSource(queryTokens, `${item.pattern}\n${item.meaning}\n${content}`) + exactPatternBonus,
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

async function queryEmbedding(query: string) {
  if (!hasEmbeddingProvider()) return null

  try {
    return await createEmbedding(query)
  } catch (error) {
    console.warn("Vector retrieval disabled for this request", error)
    return null
  }
}

export async function retrieveSourcesFromDatabase(
  query: string,
  limit = 6,
  options: RetrieveSourcesOptions = {}
): Promise<RagSource[]> {
  const queryTokens = tokenize(query)
  if (!queryTokens.length) return []

  const [vocabularySources, chunks, embedding] = await Promise.all([
    retrieveVocabularyMatchesFromDatabase(query, queryTokens),
    prisma.knowledgeChunk.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 1000,
    }),
    queryEmbedding(query),
  ])
  const newsChunkSourceIds = Array.from(
    new Set(chunks.filter((chunk) => chunk.sourceType === "todaii-news").map((chunk) => chunk.sourceId))
  )
  const newsArticles = newsChunkSourceIds.length
    ? await prisma.newsArticle.findMany({
        where: {
          OR: [
            {
              id: {
                in: newsChunkSourceIds,
              },
            },
            {
              sourceUrl: {
                in: newsChunkSourceIds,
              },
            },
          ],
        },
        select: {
          id: true,
          sourceUrl: true,
        },
      })
    : []
  const newsArticleBySource = new Map(newsArticles.flatMap((article) => [[article.id, article], [article.sourceUrl, article]]))

  const chunkSources = chunks.map((chunk) => {
    const keywordScore = scoreSource(queryTokens, expandSearchText(`${chunk.title}\n${chunk.sourceType}\n${chunk.content}`))
    const vectorScore = embedding && isEmbeddingVector(chunk.embedding)
      ? Math.max(0, cosineSimilarity(embedding, chunk.embedding)) * 100
      : 0
    const type = mapChunkType(chunk.sourceType)
    const newsArticle = type === "news" ? newsArticleBySource.get(chunk.sourceId) : null
    const sourceId = newsArticle?.id ?? chunk.sourceId

    return {
      id: chunk.id,
      sourceId,
      type,
      title: chunk.title,
      href: type === "news" ? `/reading?article=${encodeURIComponent(sourceId)}` : undefined,
      content: chunk.content,
      score: vectorScore > 0 ? vectorScore + keywordScore * 0.15 : keywordScore,
    }
  })

  const localSources = options.requireTypes?.length ? [] : retrieveSources(query, limit)
  const deduped = new Map<string, RagSource>()

  for (const source of [...vocabularySources, ...chunkSources, ...localSources]) {
    const existing = deduped.get(source.id)
    if (!existing || existing.score < source.score) {
      deduped.set(source.id, source)
    }
  }

  return sortSources(Array.from(deduped.values()).filter((source) => !isInternalTestNewsSource(source)), query, limit, options)
}

function lineValue(content: string, label: string) {
  const line = content.split("\n").find((item) => normalize(item).startsWith(normalize(label)))

  return line?.slice(line.indexOf(":") + 1).trim() ?? ""
}

function inlineValue(content: string, labels: string[], followingLabels: string[]) {
  const escapedLabels = labels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  const escapedFollowing = followingLabels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  const boundary = escapedFollowing.length
    ? `(?=\\.\\s+(?:${escapedFollowing.join("|")})\\s*:|\\n|$)`
    : `(?=\\n|$)`
  const match = content.match(new RegExp(`(?:^|\\.\\s+)(?:${escapedLabels.join("|")})\\s*:\\s*(.*?)${boundary}`, "iu"))

  return match?.[1]?.trim() ?? ""
}

function renderVocabularyFallback(source: RagSource) {
  const japanese = lineValue(source.content, "Từ vựng")
  const reading = lineValue(source.content, "Cách đọc")
  const romaji = lineValue(source.content, "Romaji")
  const inlineVocabulary = source.content.match(/^(.+?)\s+\((.+?),\s*(.+?)\)\s+means\s+(.+?)\.\s+Example:\s+(.+?)\s+-\s+(.+)$/iu)
  const meaning = lineValue(source.content, "Nghĩa") || inlineVocabulary?.[4]?.trim() || ""
  const wordType = lineValue(source.content, "Loại từ")
  const example = lineValue(source.content, "Ví dụ") || inlineVocabulary?.[5]?.trim() || ""
  const translatedExample = lineValue(source.content, "Dịch ví dụ") || inlineVocabulary?.[6]?.trim() || ""

  return [
    `${japanese || inlineVocabulary?.[1]?.trim() || source.title} nghĩa là ${meaning || "mình chưa có nghĩa tiếng Việt rõ trong dữ liệu"}.`,
    "",
    reading || romaji || inlineVocabulary
      ? `Cách đọc: ${reading || inlineVocabulary?.[2]?.trim()}${
          romaji || inlineVocabulary?.[3] ? ` (${romaji || inlineVocabulary?.[3]?.trim()})` : ""
        }`
      : null,
    wordType ? `Loại từ: ${wordType}` : null,
    example ? `Ví dụ: ${example}` : null,
    translatedExample ? `Dịch: ${translatedExample}` : null,
  ]
    .filter(Boolean)
    .join("\n")
}

function renderGrammarFallback(source: RagSource) {
  const meaning =
    lineValue(source.content, "Ý nghĩa") ||
    inlineValue(source.content, [source.title], ["Structure", "Cấu trúc"])
  const structure =
    lineValue(source.content, "Cấu trúc") ||
    inlineValue(source.content, ["Structure"], ["Usage", "Cách dùng", "Ghi chú"])
  const note =
    lineValue(source.content, "Ghi chú") ||
    lineValue(source.content, "Cách dùng") ||
    inlineValue(source.content, ["Usage"], ["Example", "Ví dụ"])
  const inlineExample =
    inlineValue(source.content, ["Example"], [])
  const [inlineJapanese, inlineVietnamese] = inlineExample.split(/\s+-\s+/, 2)
  const example = lineValue(source.content, "Ví dụ") || inlineJapanese || ""
  const translatedExample = lineValue(source.content, "Dịch ví dụ") || inlineVietnamese || ""

  return [
    source.title,
    "",
    meaning ? `Ý nghĩa: ${meaning}` : null,
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

export function isSourceRelevantToQuery(message: string, source: RagSource) {
  const foldVietnamese = (value: string) =>
    normalize(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
  const searchable = foldVietnamese(`${source.title}\n${source.content}`)
  const japaneseTerms = splitJapaneseTerms(message)

  if (japaneseTerms.some((term) => term.length > 0 && `${source.title}\n${source.content}`.includes(term))) {
    return true
  }

  const ignoredTokens = new Set([
    "ban",
    "cau",
    "cho",
    "dung",
    "giai",
    "gi",
    "hoc",
    "khong",
    "lam",
    "la",
    "minh",
    "mot",
    "nghia",
    "nhat",
    "noi",
    "them",
    "thich",
    "tieng",
    "toi",
    "viet",
    "leo",
    "luoi",
    "vui",
    "tai",
    "nua",
    "vai",
  ])
  const searchableTokens = new Set(searchable.split(" ").filter(Boolean))
  const meaningfulTokens = foldVietnamese(message)
    .split(" ")
    .filter((token) => token.length >= 3 && !ignoredTokens.has(token))

  return meaningfulTokens.some((token) => searchableTokens.has(token))
}

export function buildFallbackAnswer(message: string, sources: RagSource[]) {
  const relevantSources = sources.filter((source) => isSourceRelevantToQuery(message, source))

  if (!relevantSources.length) {
    return [
      "Mình chưa thể trả lời chắc chắn câu này lúc này vì AI đang tạm bận và kho học không có nguồn đủ khớp.",
      "",
      `Câu hỏi của bạn: ${message}`,
      "",
      "Mình sẽ không dùng một nguồn gần giống nhưng sai chủ đề để đoán câu trả lời.",
    ].join("\n")
  }

  const topSource = relevantSources[0]
  return [
    renderTopSource(topSource),
    "",
    "Cách học tiếp:",
    "- Đọc lại ví dụ tiếng Nhật.",
    "- Tự đặt 1 câu tương tự.",
    "- Hỏi tiếp nếu bạn muốn mình tách nghĩa từng phần.",
  ].join("\n")
}
