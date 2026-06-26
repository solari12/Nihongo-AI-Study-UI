import { type ActiveChatSource } from "@/lib/chat/active-source"
import { prisma } from "@/lib/prisma"
import { type RagSource } from "@/lib/rag/retriever"

export type ProjectAgentContext = {
  promptContext: string
  sources: RagSource[]
  activeSource?: ActiveChatSource | null
}

type NewsArticleMatch = {
  id: string
  provider: string
  title: string
  level: string
  category: string | null
  articleText: string
  vocabulary: unknown
  grammar: unknown
  questions: unknown
  publishedAt: Date | null
  score: number
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^\p{L}\p{N}\sぁ-んァ-ン一-龯]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function compactJson(value: unknown, maxLength = 1400) {
  if (value === null || value === undefined) return ""
  if (Array.isArray(value) && value.length === 0) return ""
  if (typeof value === "object" && Object.keys(value).length === 0) return ""

  const text = typeof value === "string" ? value : JSON.stringify(value)
  if (text === "[]" || text === "{}") return ""

  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
}

function requestedLevel(message: string) {
  return normalize(message).match(/\bn([1-5])\b/)?.[0].toUpperCase() ?? null
}

function requestedArticleCount(message: string) {
  const normalized = normalize(message)
  const digitMatch = normalized.match(/\b([1-9]|10)\b/)
  if (digitMatch) return Number(digitMatch[1])

  if (normalized.includes("mot bai")) return 1
  if (normalized.includes("hai bai")) return 2
  if (normalized.includes("ba bai")) return 3
  if (normalized.includes("bon bai")) return 4
  if (normalized.includes("nam bai")) return 5

  return null
}

function excludedArticleId(message: string) {
  return message.toLowerCase().match(/\bexclude active article id\s+([a-z0-9-]+)/)?.[1] ?? null
}

function isBeginnerReadingRequest(message: string) {
  const normalized = normalize(message)
  return (
    normalized.includes("nguoi moi") ||
    normalized.includes("moi hoc") ||
    normalized.includes("de doc") ||
    normalized.includes("nhe nhang") ||
    normalized.includes("co ban") ||
    normalized.includes("beginner")
  )
}

function isLightBeginnerTopic(article: Pick<NewsArticleMatch, "title" | "category" | "articleText">) {
  const searchable = normalize([article.title, article.category ?? "", article.articleText].join(" "))
  const lightTopicSignals = [
    "do an",
    "an uong",
    "chuoi",
    "banana",
    "dong vat",
    "thu cung",
    "meo",
    "cho",
    "truong hoc",
    "hoc sinh",
    "gia dinh",
    "thoi tiet",
    "mua",
    "nang",
  ]

  return lightTopicSignals.some((signal) => searchable.includes(signal))
}

function isInternalTestArticle(article: Pick<NewsArticleMatch, "title" | "category" | "articleText">) {
  const title = normalize(article.title)
  const category = normalize(article.category ?? "")
  const content = normalize(article.articleText)
  const combined = [title, category, content.slice(0, 1000)].join(" ")

  return (
    /\btest\b/.test(title) ||
    /\blocal\b/.test(title) ||
    /\bimport\b/.test(title) ||
    combined.includes("test local") ||
    combined.includes("local import") ||
    combined.includes("test import")
  )
}

function isNewsIntent(message: string) {
  const normalized = normalize(message)
  if (normalized.includes("bai tap")) return false

  return (
    normalized.includes("bai bao") ||
    normalized.includes("bai doc") ||
    normalized.includes("bai viet") ||
    normalized.includes("song ngu") ||
    normalized.includes("doc hieu") ||
    normalized.includes("article") ||
    normalized.includes("news") ||
    normalized.includes("todaii") ||
    /\bbai\b.*\b(khac|nao|moi|n[1-5])\b/.test(normalized) ||
    /\b(co|con|cho toi|cho minh|tim|liet ke)\b.*\bbai\b/.test(normalized)
  )
}

function isProjectIntent(message: string) {
  const normalized = normalize(message)
  return (
    normalized.includes("project") ||
    normalized.includes("du an") ||
    normalized.includes("chuc nang") ||
    normalized.includes("profile") ||
    normalized.includes("lich su") ||
    normalized.includes("tien do") ||
    normalized.includes("da luu") ||
    normalized.includes("saved")
  )
}

function textScore(queryTokens: string[], text: string) {
  const normalizedText = normalize(text)
  if (!normalizedText) return 0

  return queryTokens.reduce((score, token) => {
    if (!token || token.length < 2) return score
    if (normalizedText === token) return score + 20
    if (normalizedText.includes(token)) return score + Math.min(12, token.length + 2)
    return score
  }, 0)
}

function articleUrl(id: string) {
  return `/reading?article=${encodeURIComponent(id)}`
}

function articleSource(article: NewsArticleMatch, score = article.score): RagSource {
  const vocabulary = compactJson(article.vocabulary)
  const grammar = compactJson(article.grammar)
  const questions = compactJson(article.questions)

  return {
    id: `news-article-${article.id}`,
    sourceId: article.id,
    type: "news",
    title: article.title,
    href: articleUrl(article.id),
    content: [
      `Bai doc song ngu: ${article.title}`,
      `Cap do: ${article.level}`,
      article.category ? `Chu de: ${article.category}` : null,
      `Link noi bo bat buoc dung khi hien thi cho user: [${article.title}](${articleUrl(article.id)})`,
      "",
      "Noi dung bai:",
      article.articleText.slice(0, 8000),
      vocabulary ? ["", "Tu vung trong bai:", vocabulary].join("\n") : null,
      grammar ? ["", "Ngu phap trong bai:", grammar].join("\n") : null,
      questions ? ["", "Cau hoi co san:", questions].join("\n") : null,
    ]
      .filter((item) => item !== null)
      .join("\n"),
    score,
  }
}

function formatArticleList(articles: NewsArticleMatch[]) {
  if (!articles.length) return "Khong tim thay bai doc phu hop trong database."

  return articles
    .map(
      (article, index) =>
        `${index + 1}. ${article.title} (${article.level}${article.category ? `, ${article.category}` : ""})\n` +
        `   Link noi bo: [${article.title}](${articleUrl(article.id)})\n` +
        `   Tom tat noi dung de agent dung: ${article.articleText.slice(0, 700)}`
    )
    .join("\n\n")
}

async function searchNewsArticles(message: string) {
  const normalized = normalize(message)
  const beginnerRequest = isBeginnerReadingRequest(message)
  const level = requestedLevel(message) ?? (beginnerRequest ? "N5" : null)
  const excludedId = excludedArticleId(message)
  const limit = requestedArticleCount(message) ?? (isNewsIntent(message) ? 5 : 3)
  const tokens = normalized
    .split(" ")
    .filter((token) => token.length >= 2 && !["cho", "toi", "minh", "mot", "bai", "bao", "doc", "ve", "noi"].includes(token))

  const articles = await prisma.newsArticle.findMany({
    where: level ? { level } : undefined,
    orderBy: {
      createdAt: "desc",
    },
    take: 250,
  })

  return articles
    .filter((article) => article.id !== excludedId)
    .filter((article) => !isInternalTestArticle(article))
    .map((article) => {
      const searchable = [
        article.title,
        article.level,
        article.category ?? "",
        article.articleText,
        compactJson(article.vocabulary, 800),
        compactJson(article.grammar, 800),
      ].join("\n")

      const levelScore = level && article.level === level ? 45 : 0
      const beginnerLevelScore = beginnerRequest && article.level === "N5" ? 80 : 0
      const lightTopicScore = beginnerRequest && isLightBeginnerTopic(article) ? 35 : 0
      const score =
        textScore(tokens, searchable) +
        levelScore +
        beginnerLevelScore +
        lightTopicScore +
        (isNewsIntent(message) ? 8 : 0)

      return {
        id: article.id,
        provider: article.provider,
        title: article.title,
        level: article.level,
        category: article.category,
        articleText: article.articleText,
        vocabulary: article.vocabulary,
        grammar: article.grammar,
        questions: article.questions,
        publishedAt: article.publishedAt,
        score,
      }
    })
    .filter((article) => article.score > 0 || Boolean(level) || beginnerRequest)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

async function buildProjectSnapshot(userId: string) {
  const [articleCount, vocabularyCount, grammarCount, savedCount, recentActivities, learnerProfile, placementResult] =
    await Promise.all([
      prisma.newsArticle.count(),
      prisma.vocabulary.count(),
      prisma.grammar.count(),
      prisma.savedStudyItem.count({ where: { userId } }),
      prisma.activityLog.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.learnerProfile.findUnique({ where: { userId } }),
      prisma.placementResult.findUnique({ where: { userId } }),
    ])

  return [
    "Project capability snapshot:",
    `- Co the doc database bai doc song ngu/news: ${articleCount} bai.`,
    `- Co the tra vocabulary: ${vocabularyCount} muc.`,
    `- Co the tra grammar: ${grammarCount} muc.`,
    `- Co the doc saved study items cua user hien tai: ${savedCount} muc.`,
    "- Co the ghi activity qua bang activity_logs khi UI/API yeu cau.",
    learnerProfile
      ? `- Profile: goal=${learnerProfile.goal}, kana=${learnerProfile.kanaLevel}, dailyMinutes=${learnerProfile.dailyMinutes}, experience=${learnerProfile.experience}.`
      : "- Profile: user chua co learner profile.",
    placementResult
      ? `- Placement: ${placementResult.percentage}% (${placementResult.score}/${placementResult.total}), recommended=${placementResult.recommendedStart}.`
      : "- Placement: chua co ket qua placement.",
    recentActivities.length
      ? `- Hoat dong gan day: ${recentActivities
          .map((activity) => `${activity.type}${activity.result ? ` (${activity.result})` : ""}`)
          .join(", ")}.`
      : "- Hoat dong gan day: chua co.",
  ].join("\n")
}

export async function buildProjectAgentContext(message: string, userId: string): Promise<ProjectAgentContext> {
  const includeNews = isNewsIntent(message)
  const includeProject = isProjectIntent(message)
  const articles = includeNews ? await searchNewsArticles(message) : []
  const projectSnapshot = includeProject ? await buildProjectSnapshot(userId) : ""
  const sources = articles.map((article) => articleSource(article))

  const promptContext = [
    projectSnapshot,
    articles.length
      ? [
          "News/article tool results:",
          formatArticleList(articles),
          "",
          "Bat buoc neu tra loi ve bai doc:",
          "- Neu liet ke bai, hay kem link noi bo dang Markdown: [tieu de](/reading?article=<id>).",
          "- Khong dua link TODAII/sourceUrl ra cau tra loi. Chi dung link noi bo cua app.",
          "- Tra loi bang tieng Viet co dau, tu nhien, khong dung tieng Viet khong dau trong cau tra loi cuoi.",
          "- Neu tu vung, ngu phap hoac cau hoi rong/khong co du lieu, bo qua muc do; khong hien thi [] hoac {}.",
          "- Neu user noi 'nguoi moi hoc', 'moi hoc', 'de doc' hoac 'nhe nhang', uu tien bai N5 va chu de doi song nhu do an, dong vat, truong hoc, gia dinh, thoi tiet.",
          "- Neu user hoi noi dung/tom tat/quiz cua bai da tim thay, hay dung noi dung day du trong source tuong ung.",
          "- Neu co nhieu bai trung keyword va user chua ro bai nao, hay dua 2-5 ung vien va hoi user chon.",
        ].join("\n")
      : includeNews
        ? "News/article tool results: Khong tim thay bai doc phu hop. Hay hoi lai keyword, cap do, hoac chu de cu the hon."
        : "",
  ]
    .filter(Boolean)
    .join("\n\n")

  return {
    promptContext,
    sources,
    activeSource:
      articles.length === 1
        ? {
            type: "news",
            id: articles[0].id,
            title: articles[0].title,
          }
        : null,
  }
}
