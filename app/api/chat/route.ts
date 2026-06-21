import { NextRequest, NextResponse } from "next/server"
import { createOpenAI } from "@ai-sdk/openai"
import { generateText, stepCountIs } from "ai"
import { getCurrentUser } from "@/lib/auth"
import { type ActiveChatSource } from "@/lib/chat/active-source"
import { appendChatConversationMessage, ensureChatConversation } from "@/lib/chat/conversations"
import { buildProjectAgentContext } from "@/lib/chat/project-agent"
import { parseChatQuizCards, type ChatQuizCard, type QuizOptionLabel } from "@/lib/chat/quiz"
import { vocabularyData, type VocabularyItem } from "@/lib/data/nihongo-study"
import { prisma } from "@/lib/prisma"
import {
  buildChatPrompt,
  nihongoTutorSystemPrompt,
  type ActiveArticleContext,
  type ChatHistoryMessage,
} from "@/lib/rag/chat-prompt"
import { buildFallbackAnswer, retrieveSources, retrieveSourcesFromDatabase, type RagSource } from "@/lib/rag/retriever"
import { createStudyAgentTools } from "@/lib/rag/study-agent-tools"

type ChatRequest = {
  message?: string
  history?: ChatHistoryMessage[]
  activeSource?: ActiveChatSource | null
  conversationId?: string | null
  appState?: unknown
}

type ChatSourcePayload = {
  id: string
  sourceId?: string
  title: string
  href?: string
  type: "vocabulary" | "grammar" | "quiz" | "news"
  score?: number
}

type ChatAppState = {
  page: "chatbot" | "reading" | "vocabulary" | "grammar" | "quiz" | "dashboard" | "profile" | "unknown"
  activeSource?: ActiveChatSource | null
  latestSources: ChatSourcePayload[]
  latestAssistantQuiz?: {
    messageId?: string
    cards: ChatQuizCard[]
    sources?: ChatSourcePayload[]
  } | null
  quizState?: {
    selected: Record<string, string>
    submitted: boolean
    result?: {
      correctCount: number
      total: number
      percentage: number
    }
  } | null
  lastActionMessage?: string | null
}

type AgentIntent =
  | "knowledge_question"
  | "create_quiz"
  | "review_quiz"
  | "active_article"
  | "progress_status"
  | "saved_items_status"
  | "recent_activity"
  | "app_navigation_help"
  | "system_capability"
  | "general_chat"

function sanitizeHistory(history: unknown): ChatHistoryMessage[] {
  if (!Array.isArray(history)) return []

  return history
    .filter((item): item is ChatHistoryMessage => {
      if (!item || typeof item !== "object") return false
      const candidate = item as Partial<ChatHistoryMessage>
      return (
        (candidate.role === "user" || candidate.role === "assistant") &&
        typeof candidate.content === "string" &&
        candidate.content.trim().length > 0
      )
    })
    .map((item) => ({
      role: item.role,
      content: item.content.trim().slice(0, 1200),
    }))
    .slice(-6)
}

function responseSources(sources: Awaited<ReturnType<typeof retrieveSourcesFromDatabase>>) {
  return sources.map((source) => ({
    id: source.id,
    sourceId: source.sourceId,
    type: source.type,
    title: source.title,
    href: source.href,
    score: source.score,
  }))
}

function encodeHeaderJson(value: unknown) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url")
}

function quizCardsPayload(answer: string, enabled = true) {
  if (!enabled) return undefined
  const quiz = parseChatQuizCards(answer)
  return quiz.cards.length ? quiz.cards : undefined
}

function sanitizeActiveSource(value: unknown): ActiveChatSource | null {
  if (!value || typeof value !== "object") return null
  const candidate = value as Partial<ActiveChatSource>

  if (
    (candidate.type === "news" || candidate.type === "grammar" || candidate.type === "vocabulary" || candidate.type === "quiz") &&
    typeof candidate.id === "string" &&
    candidate.id.trim() &&
    typeof candidate.title === "string" &&
    candidate.title.trim()
  ) {
    return {
      type: candidate.type,
      id: candidate.id.trim(),
      title: candidate.title.trim(),
    }
  }

  return null
}

function sanitizeChatSource(value: unknown): ChatSourcePayload | null {
  if (!value || typeof value !== "object") return null
  const candidate = value as Partial<ChatSourcePayload>
  if (
    (candidate.type === "news" || candidate.type === "grammar" || candidate.type === "vocabulary" || candidate.type === "quiz") &&
    typeof candidate.id === "string" &&
    candidate.id.trim() &&
    typeof candidate.title === "string" &&
    candidate.title.trim()
  ) {
    return {
      id: candidate.id.trim(),
      sourceId: typeof candidate.sourceId === "string" ? candidate.sourceId.trim() : undefined,
      type: candidate.type,
      title: candidate.title.trim().slice(0, 240),
      href: typeof candidate.href === "string" ? candidate.href.trim().slice(0, 500) : undefined,
      score: typeof candidate.score === "number" ? candidate.score : undefined,
    }
  }

  return null
}

function sanitizeQuizCard(value: unknown): ChatQuizCard | null {
  if (!value || typeof value !== "object") return null
  const candidate = value as Partial<ChatQuizCard>
  if (typeof candidate.id !== "string" || typeof candidate.question !== "string" || !Array.isArray(candidate.options)) {
    return null
  }

  const options = candidate.options
    .filter((option) => option && typeof option === "object")
    .map((option) => option as { label?: unknown; text?: unknown })
    .filter((option) => (option.label === "A" || option.label === "B" || option.label === "C" || option.label === "D") && typeof option.text === "string")
    .map((option) => ({
      label: option.label as QuizOptionLabel,
      text: String(option.text).slice(0, 300),
    }))
    .slice(0, 4)

  if (!candidate.question.trim() || options.length < 2) return null

  return {
    id: candidate.id.trim().slice(0, 120),
    question: candidate.question.trim().slice(0, 500),
    options,
    answer:
      candidate.answer === "A" || candidate.answer === "B" || candidate.answer === "C" || candidate.answer === "D"
        ? candidate.answer
        : undefined,
    explanation: typeof candidate.explanation === "string" ? candidate.explanation.slice(0, 800) : undefined,
  }
}

function sanitizeQuizState(value: unknown): ChatAppState["quizState"] {
  if (!value || typeof value !== "object") return null
  const candidate = value as {
    selected?: unknown
    submitted?: unknown
    result?: unknown
  }
  const selected: Record<string, string> = {}

  if (candidate.selected && typeof candidate.selected === "object") {
    for (const [key, option] of Object.entries(candidate.selected as Record<string, unknown>)) {
      if (typeof option === "string" && ["A", "B", "C", "D"].includes(option)) {
        selected[key.slice(0, 120)] = option
      }
    }
  }

  const resultCandidate = candidate.result && typeof candidate.result === "object"
    ? candidate.result as { correctCount?: unknown; total?: unknown; percentage?: unknown }
    : null

  return {
    selected,
    submitted: Boolean(candidate.submitted),
    result:
      typeof resultCandidate?.correctCount === "number" &&
      typeof resultCandidate?.total === "number" &&
      typeof resultCandidate?.percentage === "number"
        ? {
            correctCount: resultCandidate.correctCount,
            total: resultCandidate.total,
            percentage: resultCandidate.percentage,
          }
        : undefined,
  }
}

function sanitizeAppState(value: unknown, activeSource: ActiveChatSource | null): ChatAppState {
  if (!value || typeof value !== "object") {
    return {
      page: "unknown",
      activeSource,
      latestSources: [],
    }
  }

  const candidate = value as {
    page?: unknown
    activeSource?: unknown
    latestSources?: unknown
    latestAssistantQuiz?: unknown
    quizState?: unknown
    lastActionMessage?: unknown
  }
  const validPages = new Set(["chatbot", "reading", "vocabulary", "grammar", "quiz", "dashboard", "profile", "unknown"])
  const page = typeof candidate.page === "string" && validPages.has(candidate.page) ? candidate.page as ChatAppState["page"] : "unknown"
  const latestSources = Array.isArray(candidate.latestSources)
    ? candidate.latestSources.map(sanitizeChatSource).filter((source): source is ChatSourcePayload => Boolean(source)).slice(0, 8)
    : []
  const latestQuiz = candidate.latestAssistantQuiz && typeof candidate.latestAssistantQuiz === "object"
    ? candidate.latestAssistantQuiz as { messageId?: unknown; cards?: unknown; sources?: unknown }
    : null
  const latestQuizCards = Array.isArray(latestQuiz?.cards)
    ? latestQuiz.cards.map(sanitizeQuizCard).filter((card): card is ChatQuizCard => Boolean(card)).slice(0, 10)
    : []
  const latestQuizSources = Array.isArray(latestQuiz?.sources)
    ? latestQuiz.sources.map(sanitizeChatSource).filter((source): source is ChatSourcePayload => Boolean(source)).slice(0, 8)
    : undefined

  return {
    page,
    activeSource: sanitizeActiveSource(candidate.activeSource) ?? activeSource,
    latestSources,
    latestAssistantQuiz: latestQuizCards.length
      ? {
          messageId: typeof latestQuiz?.messageId === "string" ? latestQuiz.messageId.slice(0, 120) : undefined,
          cards: latestQuizCards,
          sources: latestQuizSources,
        }
      : null,
    quizState: sanitizeQuizState(candidate.quizState),
    lastActionMessage: typeof candidate.lastActionMessage === "string" ? candidate.lastActionMessage.slice(0, 500) : null,
  }
}

function jsonSummary(value: unknown, maxLength = 1200) {
  if (value === null || value === undefined) return ""
  const text = typeof value === "string" ? value : JSON.stringify(value)
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
}

async function getActiveArticleContext(activeSource: ActiveChatSource | null): Promise<ActiveArticleContext | null> {
  if (activeSource?.type !== "news") return null

  const article = await prisma.newsArticle.findUnique({
    where: {
      id: activeSource.id,
    },
  })

  if (!article) return null

  return {
    title: article.title,
    level: article.level,
    category: article.category,
    articleText: article.articleText.slice(0, 8000),
    vocabulary: jsonSummary(article.vocabulary),
    grammar: jsonSummary(article.grammar),
    questions: jsonSummary(article.questions),
  }
}

function activeSourceFromSources(sources: ReturnType<typeof responseSources>): ActiveChatSource | undefined {
  const newsSource = sources.find((source) => source.type === "news" && source.sourceId)
  if (!newsSource?.sourceId) return undefined

  return {
    type: "news",
    id: newsSource.sourceId,
    title: newsSource.title,
  }
}

function isUsefulModelText(value: string) {
  const trimmed = value.trim()
  if (trimmed.length < 16) return false

  const withoutMarkdown = trimmed.replace(/[#*_`\-\s.。…]+/g, "")
  if (withoutMarkdown.length < 8) return false

  return /[\p{L}\p{N}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u.test(withoutMarkdown)
}

function normalizeIntentText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/\u0111/g, "d")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function isCasualOrMetaMessage(message: string) {
  if (/[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u.test(message)) return false

  const normalized = normalizeIntentText(message)
  const learningSignals = [
    "nghia",
    "ngu phap",
    "tu vung",
    "kanji",
    "hiragana",
    "katakana",
    "romaji",
    "jlpt",
    "n5",
    "n4",
    "dich",
    "giai thich",
    "vi du",
    "quiz",
    "mau cau",
    "cau truc",
  ]

  if (learningSignals.some((signal) => normalized.includes(signal))) return false

  return (
    /^(chao|hi|hello|hey|alo)\b/.test(normalized) ||
    normalized.includes("toi hoi cai nay co duoc") ||
    normalized.includes("minh hoi cai nay co duoc") ||
    normalized.includes("hoi cai nay co duoc") ||
    normalized.includes("hoi cai nay duoc khong") ||
    normalized.includes("hoi duoc khong") ||
    normalized.includes("co duoc khong") ||
    normalized.includes("duoc khong vay")
  )
}

function buildCasualAnswer(message: string) {
  const normalized = normalizeIntentText(message)

  if (/^(chao|hi|hello|hey|alo)\b/.test(normalized)) {
    return "Chào bạn, bạn cứ hỏi nhé. Mình sẽ trả lời ngắn gọn, dễ hiểu."
  }

  return "Được chứ. Bạn cứ hỏi thẳng câu bạn muốn hỏi, mình sẽ trả lời bình thường; nếu liên quan tiếng Nhật thì mình mới giải thích theo kiểu học."
}

function isQuizFollowUp(message: string) {
  const normalized = normalizeIntentText(message)
  const asksForQuiz =
    normalized.includes("trac nghiem") ||
    normalized.includes("quiz") ||
    normalized.includes("bai tap") ||
    normalized.includes("luyen tap") ||
    normalized.includes("thuc hanh") ||
    normalized.includes("on tap") ||
    (normalized.includes("sinh") && normalized.includes("cau")) ||
    (normalized.includes("tao") && normalized.includes("cau")) ||
    /\b([1-9]|10)\b.*\bcau\b/.test(normalized) ||
    normalized.includes("chon dap an") ||
    normalized.includes("chon cau dung")

  return asksForQuiz && normalized.length <= 80
}

function isExplicitCreateQuizRequest(message: string) {
  const normalized = normalizeIntentText(message)
  const asksForQuiz =
    normalized.includes("quiz") ||
    normalized.includes("trac nghiem") ||
    normalized.includes("bai tap") ||
    normalized.includes("kiem tra") ||
    normalized.includes("cau hoi")
  const createSignal =
    normalized.includes("tao") ||
    normalized.includes("thiet ke") ||
    normalized.includes("cho minh") ||
    normalized.includes("hay tao") ||
    normalized.includes("kiem tra ngay")

  return asksForQuiz && createSignal
}

function isVagueQuizRequest(message: string) {
  const normalized = normalizeIntentText(message)
  return (
    /^(tao|sinh|cho toi|cho minh)?\s*(cau hoi|bai tap|quiz|trac nghiem)\s*(voi|di)?$/.test(normalized) ||
    normalized === "luyen tap" ||
    normalized === "on tap" ||
    normalized === "thuc hanh"
  )
}

function isVagueArticleRequest(message: string) {
  const normalized = normalizeIntentText(message)
  return (
    normalized.includes("tu bai bao") ||
    normalized.includes("ve bai bao") ||
    normalized.includes("bai nay") ||
    normalized.includes("bai do")
  )
}

function isArticleBrowseRequest(message: string) {
  const normalized = normalizeIntentText(message)
  if (normalized.includes("bai tap")) return false

  return (
    normalized.includes("bai bao") ||
    normalized.includes("bai doc") ||
    normalized.includes("bai viet") ||
    normalized.includes("doc hieu") ||
    normalized.includes("article") ||
    normalized.includes("news") ||
    /\bbai\b.*\b(khac|nao|moi|n[1-5])\b/.test(normalized) ||
    /\b(co|con|cho toi|cho minh|tim|liet ke)\b.*\bbai\b/.test(normalized)
  )
}

function isClearNewTopic(message: string) {
  const normalized = normalizeIntentText(message)
  const articleSignals = ["bai nay", "bai do", "bai bao", "trong bai", "doan nay", "doc hieu"]
  if (articleSignals.some((signal) => normalized.includes(signal))) return false

  const newTopicSignals = [
    "giai thich",
    "phan biet",
    "nghia la gi",
    "ngu phap",
    "tu vung",
    "kanji",
    "hiragana",
    "katakana",
    "romaji",
    "tro tu",
  ]

  return newTopicSignals.some((signal) => normalized.includes(signal))
}

function shouldUseActiveArticle(message: string, activeSource: ActiveChatSource | null) {
  if (activeSource?.type !== "news") return false
  if (isArticleBrowseRequest(message)) return false
  if (isClearNewTopic(message)) return false
  return true
}

function requestedQuizCount(message: string) {
  const normalized = normalizeIntentText(message)
  const digitMatch = normalized.match(/\b([1-9]|10)\b/)
  if (digitMatch) return Number(digitMatch[1])

  if (normalized.includes("mot cau")) return 1
  if (normalized.includes("hai cau")) return 2
  if (normalized.includes("ba cau")) return 3
  if (normalized.includes("bon cau")) return 4
  if (normalized.includes("nam cau")) return 5
  if (normalized.includes("sau cau")) return 6
  if (normalized.includes("bay cau")) return 7
  if (normalized.includes("tam cau")) return 8
  if (normalized.includes("chin cau")) return 9
  if (normalized.includes("muoi cau")) return 10

  return null
}

type QuizVocabularyItem = {
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

function isRandomVocabularyQuizRequest(message: string) {
  const normalized = normalizeIntentText(message)
  const wantsQuiz =
    normalized.includes("quiz") ||
    normalized.includes("trac nghiem") ||
    normalized.includes("bai tap") ||
    normalized.includes("chon dap an")
  const wantsVocabulary = normalized.includes("tu vung") || normalized.includes("vocabulary")
  const wantsSystemData =
    normalized.includes("du lieu he thong") ||
    normalized.includes("trong du lieu") ||
    normalized.includes("ngau nhien") ||
    normalized.includes("random") ||
    normalized.includes("jlpt") ||
    /\bn[1-5]\b/.test(normalized)

  return wantsQuiz && wantsVocabulary && wantsSystemData
}

function isLevelDiagnosticRequest(message: string) {
  const normalized = normalizeIntentText(message)
  const asksToCheck =
    normalized.includes("kiem tra trinh do") ||
    normalized.includes("test trinh do") ||
    normalized.includes("kiem tra nang luc") ||
    normalized.includes("danh gia trinh do") ||
    normalized.includes("kiem tra n5") ||
    normalized.includes("kiem tra n4") ||
    normalized.includes("thi thu") ||
    normalized.includes("placement")
  const mentionsLevel = /\bn[1-5]\b/.test(normalized) || normalized.includes("jlpt")

  return asksToCheck && mentionsLevel
}

function isJlptGoalPlanRequest(message: string) {
  const normalized = normalizeIntentText(message)
  const mentionsExam = normalized.includes("thi") || normalized.includes("jlpt")
  const mentionsN4 = normalized.includes("n4")
  const mentionsN5Base =
    normalized.includes("moi xong n5") ||
    normalized.includes("vua xong n5") ||
    normalized.includes("xong n5") ||
    normalized.includes("hoc xong n5") ||
    normalized.includes("nen n5")
  const wantsPlan =
    normalized.includes("phai lam sao") ||
    normalized.includes("lam sao") ||
    normalized.includes("ke hoach") ||
    normalized.includes("lo trinh") ||
    normalized.includes("hoc gi") ||
    normalized.includes("nen hoc")

  return mentionsExam && mentionsN4 && (mentionsN5Base || wantsPlan)
}

function shuffleItems<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5)
}

function localVocabularyItems(): QuizVocabularyItem[] {
  return vocabularyData.map((item: VocabularyItem) => ({
    id: item.id,
    japanese: item.japanese,
    hiragana: item.hiragana,
    romaji: item.romaji,
    vietnamese: item.vietnamese,
    type: item.type,
    topic: item.topic,
    exampleJapanese: item.example.japanese,
    exampleVietnamese: item.example.vietnamese,
  }))
}

async function randomVocabularyItems(count: number) {
  const dbItems = await prisma.vocabulary.findMany({
    orderBy: {
      id: "asc",
    },
  })
  const items = dbItems.length
    ? dbItems.map((item) => ({
        id: item.id,
        japanese: item.japanese,
        hiragana: item.hiragana,
        romaji: item.romaji,
        vietnamese: item.vietnamese,
        type: item.type,
        topic: item.topic,
        exampleJapanese: item.exampleJapanese,
        exampleVietnamese: item.exampleVietnamese,
      }))
    : localVocabularyItems()

  return shuffleItems(items).slice(0, Math.min(count, items.length))
}

function vocabularySource(item: QuizVocabularyItem): RagSource {
  return {
    id: `vocabulary-${item.id}`,
    sourceId: String(item.id),
    type: "vocabulary",
    title: `${item.japanese} (${item.hiragana})`,
    content: [
      `Tu vung: ${item.japanese}`,
      `Cach doc: ${item.hiragana}`,
      `Romaji: ${item.romaji}`,
      `Nghia: ${item.vietnamese}`,
      `Loai tu: ${item.type}`,
      `Chu de: ${item.topic}`,
      `Vi du: ${item.exampleJapanese}`,
      `Dich vi du: ${item.exampleVietnamese}`,
    ].join("\n"),
    score: 100,
  }
}

function buildRandomVocabularyQuizAnswer(items: QuizVocabularyItem[]) {
  const labels = ["A", "B", "C", "D"]
  const allMeanings = Array.from(
    new Set(
      localVocabularyItems()
        .concat(items)
        .map((item) => item.vietnamese)
    )
  )
  const lines: string[] = []

  items.forEach((item, index) => {
    const distractors = shuffleItems(allMeanings.filter((meaning) => meaning !== item.vietnamese))
      .slice(0, 3)
    const options = shuffleItems(Array.from(new Set([item.vietnamese, ...distractors]))).slice(0, 4)
    const correctIndex = options.findIndex((option) => option === item.vietnamese)

    lines.push(`Cau ${index + 1}: ${item.japanese} (${item.hiragana}) co nghia la gi?`)
    options.forEach((option, optionIndex) => {
      lines.push(`${labels[optionIndex]}. ${option}`)
    })
    lines.push(`Dap an: ${labels[correctIndex]}`)
    lines.push(`Giai thich: ${item.japanese} doc la ${item.hiragana}, nghia la "${item.vietnamese}".`)
    if (index < items.length - 1) lines.push("")
  })

  return lines.join("\n")
}

function requestedJlptLevel(message: string) {
  const normalized = normalizeIntentText(message)
  const levelMatch = normalized.match(/\bn([1-5])\b/)
  return levelMatch ? `N${levelMatch[1]}` : "N5"
}

function buildLevelDiagnosticQuizAnswer(items: QuizVocabularyItem[], level: string) {
  const quiz = buildRandomVocabularyQuizAnswer(items)

  return [
    `Kami sẽ kiểm tra nhanh nền tảng ${level} của bạn bằng quiz chẩn đoán từ dữ liệu thật trong project.`,
    "",
    quiz,
    "",
    "Cách đọc kết quả:",
    `- 80% trở lên: nền ${level} khá ổn, có thể bắt đầu học lên N4 nhưng vẫn cần ôn lỗi sai.`,
    `- 60-79%: nên ôn lại từ vựng/ngữ pháp ${level} trọng điểm trước khi tăng tốc.`,
    `- Dưới 60%: chưa nên nhảy nhanh lên N4; hãy củng cố ${level} thêm 1-2 tuần.`,
    "",
    "Bạn chọn A/B/C/D rồi bấm `Nộp bài`; Kami sẽ dựa vào kết quả để gợi ý lộ trình học tiếp.",
  ].join("\n")
}

async function buildDiagnosticQuizFallbackAnswer(message: string) {
  const count = requestedQuizCount(message) ?? 3
  const level = requestedJlptLevel(message)
  const questions = await prisma.quizQuestion.findMany({
    include: {
      answers: true,
    },
    orderBy: {
      id: "asc",
    },
    take: Math.min(30, count * 5),
  })
  const selected = shuffleItems(questions).slice(0, count)

  if (!selected.length) {
    return "Kami chưa có đủ câu hỏi trong ngân hàng quiz để kiểm tra trình độ lúc này."
  }

  const lines = [
    `Kami sẽ kiểm tra nhanh trình độ ${level} của bạn bằng ${selected.length} câu từ ngân hàng quiz trong hệ thống.`,
    "",
  ]

  selected.forEach((question, index) => {
    lines.push(`Cau ${index + 1}: ${question.question}`)
    question.answers
      .sort((a, b) => a.answerKey.localeCompare(b.answerKey))
      .forEach((answer) => {
        lines.push(`${answer.answerKey}. ${answer.answerText}`)
      })
    lines.push(`Dap an: ${question.correctAnswer}`)
    lines.push(`Giai thich: ${question.explanation}`)
    if (index < selected.length - 1) lines.push("")
  })

  return lines.join("\n")
}

function latestAssistantQuizCards(history: ChatHistoryMessage[]) {
  const latestAssistant = latestHistoryContent(history, "assistant")
  if (!latestAssistant) return []

  return parseChatQuizCards(latestAssistant).cards.filter((card) => card.answer)
}

function isQuizAnswerCheckRequest(message: string) {
  const normalized = normalizeIntentText(message)
  return (
    normalized.includes("cham") ||
    normalized.includes("check") ||
    normalized.includes("nop bai") ||
    normalized.includes("dap an") ||
    normalized.includes("dung may cau") ||
    normalized.includes("sai may cau") ||
    normalized.includes("ket qua") ||
    /\bcau\s*\d+\s*[a-d]\b/.test(normalized) ||
    /\bcau\s*\d+\s*(chon|la|dap an)\s*[a-d]\b/.test(normalized) ||
    /\bq\s*\d+\s*[a-d]\b/.test(normalized)
  )
}

function parseQuizSelections(message: string, cards: ChatQuizCard[]) {
  const normalized = normalizeIntentText(message)
  const selections = new Map<number, QuizOptionLabel>()

  for (const match of normalized.matchAll(/(?:cau|q)\s*(\d+)\s*([a-d])\b/g)) {
    const index = Number(match[1])
    const label = match[2].toUpperCase() as QuizOptionLabel
    if (index >= 1 && index <= cards.length) selections.set(index, label)
  }

  for (const match of normalized.matchAll(/\b(\d+)\s*([a-d])\b/g)) {
    const index = Number(match[1])
    const label = match[2].toUpperCase() as QuizOptionLabel
    if (index >= 1 && index <= cards.length && !selections.has(index)) {
      selections.set(index, label)
    }
  }

  return selections
}

function buildQuizReviewAnswer(message: string, cards: ChatQuizCard[]) {
  const selections = parseQuizSelections(message, cards)

  if (!selections.size) {
    return [
      "Mình thấy bạn đang hỏi về bài quiz vừa rồi, nhưng trong tin nhắn này mình chưa đọc được lựa chọn A/B/C/D cho từng câu.",
      "",
      "Nếu bạn đã bấm `Nộp bài` trên UI thì phần quiz card đã tự chấm và gọi lưu lượt quiz vào thống kê. Còn `Saved study items` không tự lưu từ vựng; phần đó chỉ lưu khi bạn bấm `Lưu nguồn`.",
    ].join("\n")
  }

  let correctCount = 0
  const lines = ["Mình chấm theo quiz ngay trước đó nhé:"]

  cards.forEach((card, index) => {
    const questionNumber = index + 1
    const selected = selections.get(questionNumber)
    const correct = card.answer
    const isCorrect = Boolean(selected && correct && selected === correct)
    if (isCorrect) correctCount += 1

    lines.push(
      `Câu ${questionNumber}: ${selected ?? "chưa chọn"} - ${isCorrect ? "đúng" : `sai, đáp án đúng là ${correct ?? "chưa có"}`}.`
    )
  })

  const percentage = Math.round((correctCount / cards.length) * 100)
  lines.push("")
  lines.push(`Kết quả: ${correctCount}/${cards.length} câu đúng (${percentage}%).`)
  lines.push("")
  lines.push("Về dữ liệu hệ thống: nếu bạn bấm `Nộp bài` trên quiz card thì lượt quiz được ghi vào thống kê quiz/progress. Ba từ này chưa tự động vào `Saved study items`; muốn lưu nguồn ôn tập thì bấm `Lưu nguồn`.")

  return lines.join("\n")
}

function activeQuizCards(appState: ChatAppState, history: ChatHistoryMessage[]) {
  const cardsFromState = appState.latestAssistantQuiz?.cards?.filter((card) => card.answer) ?? []
  if (cardsFromState.length) return cardsFromState
  return latestAssistantQuizCards(history)
}

function quizSelectionsFromState(appState: ChatAppState, cards: ChatQuizCard[]) {
  const selected = appState.quizState?.selected ?? {}
  const selections = new Map<number, QuizOptionLabel>()

  cards.forEach((card, index) => {
    const option = selected[card.id]
    if (option === "A" || option === "B" || option === "C" || option === "D") {
      selections.set(index + 1, option)
    }
  })

  return selections
}

function gradeQuiz(cards: ChatQuizCard[], selections: Map<number, QuizOptionLabel>) {
  let correctCount = 0
  const rows = cards.map((card, index) => {
    const questionNumber = index + 1
    const selected = selections.get(questionNumber)
    const correct = card.answer
    const isCorrect = Boolean(selected && correct && selected === correct)
    if (isCorrect) correctCount += 1

    return {
      questionNumber,
      selected,
      correct,
      isCorrect,
    }
  })

  return {
    rows,
    correctCount,
    total: cards.length,
    percentage: cards.length ? Math.round((correctCount / cards.length) * 100) : 0,
  }
}

function isProgressRequest(message: string) {
  const normalized = normalizeIntentText(message)
  return (
    normalized.includes("tien do") ||
    normalized.includes("thong ke") ||
    normalized.includes("diem so") ||
    normalized.includes("diem quiz") ||
    normalized.includes("bao nhieu diem") ||
    normalized.includes("duoc may diem") ||
    normalized.includes("hoc gi tiep") ||
    normalized.includes("nen hoc gi") ||
    normalized.includes("progress") ||
    normalized.includes("dashboard")
  )
}

function isKnowledgeLearningRequest(message: string) {
  const normalized = normalizeIntentText(message)
  const hasJapanese = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u.test(message)
  const learningSignals = [
    "ngu phap",
    "tu vung",
    "kanji",
    "hiragana",
    "katakana",
    "romaji",
    "jlpt",
    "n5",
    "n4",
    "dich",
    "giai thich",
    "vi du",
    "mau cau",
    "cau truc",
    "tro tu",
    "phan biet",
    "nghia la gi",
    "doc la gi",
    "dung nhu the nao",
  ]

  return hasJapanese || learningSignals.some((signal) => normalized.includes(signal))
}

function isSavedItemsRequest(message: string) {
  const normalized = normalizeIntentText(message)
  return (
    normalized.includes("luu chua") ||
    normalized.includes("da luu") ||
    normalized.includes("saved") ||
    normalized.includes("saved study") ||
    normalized.includes("luu nguon") ||
    normalized.includes("on tap")
  )
}

function isRecentActivityRequest(message: string) {
  const normalized = normalizeIntentText(message)
  return (
    normalized.includes("vua lam gi") ||
    normalized.includes("lich su") ||
    normalized.includes("hoat dong gan day") ||
    normalized.includes("activity")
  )
}

function isSystemCapabilityRequest(message: string) {
  const normalized = normalizeIntentText(message)
  return (
    normalized.includes("lam duoc gi") ||
    normalized.includes("lam duoc nhung gi") ||
    normalized.includes("co the lam gi") ||
    normalized.includes("co the lam duoc") ||
    normalized.includes("ho tro") ||
    normalized.includes("du lieu hoc") ||
    normalized.includes("du lieu he thong") ||
    normalized.includes("tu con so 0") ||
    normalized.includes("moi hoc") ||
    normalized.includes("bat dau hoc") ||
    normalized.includes("project nay") ||
    normalized.includes("app nay") ||
    normalized.includes("chatbot nay") ||
    normalized.includes("he thong nay") ||
    normalized.includes("he thong cua ban")
  )
}

function isNavigationHelpRequest(message: string) {
  const normalized = normalizeIntentText(message)
  return (
    normalized.includes("vao dau") ||
    normalized.includes("o dau") ||
    normalized.includes("bam gi") ||
    normalized.includes("lam sao de") ||
    normalized.includes("cach dung")
  )
}

function detectAgentIntents(message: string, appState: ChatAppState, history: ChatHistoryMessage[]): AgentIntent[] {
  const intents = new Set<AgentIntent>()
  const quizCards = activeQuizCards(appState, history)
  const knowledgeRequest = isKnowledgeLearningRequest(message)
  const wantsCreateQuiz =
    isLevelDiagnosticRequest(message) ||
    isRandomVocabularyQuizRequest(message) ||
    isExplicitCreateQuizRequest(message) ||
    isQuizFollowUp(message) ||
    isVagueQuizRequest(message)

  if (!knowledgeRequest && quizCards.length && isQuizAnswerCheckRequest(message)) intents.add("review_quiz")
  if (wantsCreateQuiz) intents.add("create_quiz")
  if (isArticleBrowseRequest(message) || isVagueArticleRequest(message) || shouldUseActiveArticle(message, appState.activeSource ?? null)) {
    intents.add("active_article")
  }
  if (!knowledgeRequest && !wantsCreateQuiz && isProgressRequest(message)) intents.add("progress_status")
  if (!knowledgeRequest && !wantsCreateQuiz && isSavedItemsRequest(message)) intents.add("saved_items_status")
  if (!knowledgeRequest && !wantsCreateQuiz && isRecentActivityRequest(message)) intents.add("recent_activity")
  if (isSystemCapabilityRequest(message)) intents.add("system_capability")
  if (isNavigationHelpRequest(message)) intents.add("app_navigation_help")
  if (knowledgeRequest && !wantsCreateQuiz) intents.add("knowledge_question")
  if (!intents.size) intents.add(isCasualOrMetaMessage(message) ? "general_chat" : "knowledge_question")

  return Array.from(intents)
}

async function getStudyProgress(userId: string) {
  const [vocabularyProgress, quizAttempts, vocabularyTotal, grammarTotal, completedGrammar] = await Promise.all([
    prisma.userVocabularyProgress.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.quizAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.vocabulary.count(),
    prisma.grammar.count(),
    prisma.grammar.count({ where: { status: "completed" } }),
  ])
  const now = new Date()
  const learnedVocabulary = vocabularyProgress.length
  const reviewVocabulary = vocabularyProgress.filter((item) => item.dueAt <= now).length
  const averageQuizScore = quizAttempts.length
    ? Math.round(quizAttempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / quizAttempts.length)
    : 0
  const latestQuiz = quizAttempts[0]

  return {
    learnedVocabulary,
    reviewVocabulary,
    totalVocabulary: vocabularyTotal,
    completedGrammar,
    totalGrammar: grammarTotal,
    quizAttempts: quizAttempts.length,
    averageQuizScore,
    latestQuiz: latestQuiz
      ? {
          score: latestQuiz.score,
          total: latestQuiz.total,
          percentage: latestQuiz.percentage,
          quizType: latestQuiz.quizType,
          createdAt: latestQuiz.createdAt,
        }
      : null,
  }
}

async function getSavedStudyItems(userId: string) {
  return prisma.savedStudyItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 12,
  })
}

async function getRecentActivity(userId: string) {
  return prisma.activityLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 8,
  })
}

function formatDateTime(value: Date) {
  return value.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  })
}

function buildQuizStateAnswer(message: string, appState: ChatAppState, history: ChatHistoryMessage[]) {
  const cards = activeQuizCards(appState, history)
  if (!cards.length) return null
  const textSelections = parseQuizSelections(message, cards)
  const stateSelections = quizSelectionsFromState(appState, cards)
  const selections = textSelections.size ? textSelections : stateSelections

  if (appState.quizState?.submitted && appState.quizState.result && !textSelections.size) {
    return [
      "Mình nhìn theo trạng thái quiz hiện tại trong app:",
      "",
      `Kết quả: ${appState.quizState.result.correctCount}/${appState.quizState.result.total} câu đúng (${appState.quizState.result.percentage}%).`,
      appState.lastActionMessage ? `Trạng thái gần nhất: ${appState.lastActionMessage}` : "",
      "",
      "Nộp bài ghi nhận lượt quiz/progress. Saved study items là luồng riêng: chỉ lưu khi bạn bấm `Lưu nguồn` hoặc có thao tác lưu rõ ràng.",
    ].filter(Boolean).join("\n")
  }

  if (!selections.size) return buildQuizReviewAnswer(message, cards)

  const grade = gradeQuiz(cards, selections)
  const lines = ["Mình chấm theo quiz hiện tại:"]
  for (const row of grade.rows) {
    lines.push(`Câu ${row.questionNumber}: ${row.selected ?? "chưa chọn"} - ${row.isCorrect ? "đúng" : `sai, đáp án đúng là ${row.correct ?? "chưa có"}`}.`)
  }
  lines.push("")
  lines.push(`Kết quả: ${grade.correctCount}/${grade.total} câu đúng (${grade.percentage}%).`)
  lines.push("")
  lines.push("Nếu bạn đã bấm `Nộp bài`, app sẽ ghi lượt quiz vào progress. Còn Saved study items không tự lưu toàn bộ từ trong quiz; dùng nút `Lưu nguồn` để lưu nguồn ôn tập.")

  return lines.join("\n")
}

async function buildProgressAnswer(userId: string, appState: ChatAppState) {
  const progress = await getStudyProgress(userId)
  const quizLine = progress.latestQuiz
    ? `Quiz gần nhất: ${progress.latestQuiz.score}/${progress.latestQuiz.total} (${progress.latestQuiz.percentage}%).`
    : "Chưa có lượt quiz nào được ghi nhận."

  return [
    "Mình đọc trạng thái học hiện tại trong hệ thống:",
    "",
    `Từ vựng đã học: ${progress.learnedVocabulary}/${progress.totalVocabulary}.`,
    `Từ cần ôn: ${progress.reviewVocabulary}.`,
    `Ngữ pháp hoàn thành: ${progress.completedGrammar}/${progress.totalGrammar}.`,
    `Số lượt quiz: ${progress.quizAttempts}. Điểm quiz trung bình: ${progress.averageQuizScore}%.`,
    quizLine,
    appState.quizState?.submitted && appState.quizState.result
      ? `Quiz đang mở trên UI: đã nộp ${appState.quizState.result.correctCount}/${appState.quizState.result.total}.`
      : "",
    "",
    progress.reviewVocabulary > 0
      ? "Gợi ý tiếp theo: ôn lại các từ đang ở trạng thái review, rồi làm thêm một quiz ngắn."
      : "Gợi ý tiếp theo: học thêm 5-10 từ mới hoặc làm một quiz ngắn để hệ thống có thêm dữ liệu đánh giá.",
  ].filter(Boolean).join("\n")
}

async function buildJlptGoalPlanAnswer(userId: string) {
  const progress = await getStudyProgress(userId)
  const currentDate = new Date()
  const month = currentDate.getMonth() + 1
  const isCloseToJuly = month === 6 || month === 7

  return [
    "Kami kiểm tra theo mục tiêu của bạn: muốn thi N4 vào tháng 7 khi vừa xong N5.",
    "",
    "Đánh giá nhanh:",
    `- Từ vựng đã học trong app: ${progress.learnedVocabulary}/${progress.totalVocabulary}.`,
    `- Từ cần ôn: ${progress.reviewVocabulary}.`,
    `- Ngữ pháp hoàn thành: ${progress.completedGrammar}/${progress.totalGrammar}.`,
    `- Số lượt quiz đã ghi nhận: ${progress.quizAttempts}. Điểm quiz trung bình: ${progress.averageQuizScore}%.`,
    "",
    isCloseToJuly
      ? "Vì hiện đã rất gần tháng 7, mục tiêu N4 là gấp. Bạn không nên chỉ học thêm tài liệu mới; phải kiểm tra nền N5 trước rồi mới tăng tốc N4."
      : "Nếu còn nhiều hơn 6-8 tuần, bạn có thể học theo nhịp vừa phải hơn, nhưng vẫn nên kiểm tra nền N5 trước.",
    "",
    "Kế hoạch ưu tiên:",
    "1. Hôm nay: làm quiz chẩn đoán N5 8-10 câu. Nếu dưới 80%, ôn lỗi sai trước khi học N4.",
    "2. Mỗi ngày: học 20-30 từ N4, 3-5 mẫu ngữ pháp N4, đọc 1 bài ngắn và làm 1 quiz.",
    "3. Mỗi tuần: làm một bài đọc hiểu + quiz tổng hợp, ghi lại nhóm lỗi: từ vựng, trợ từ, chia thể, đọc hiểu.",
    "4. Hai tuần cuối: giảm học mới, tập trung đề mô phỏng, tốc độ đọc và nghe.",
    "",
    "Mốc quyết định:",
    "- Nếu quiz N5 đạt từ 80% trở lên: bắt đầu học N4 ngay, nhưng vẫn ôn lỗi N5 mỗi ngày.",
    "- Nếu 60-79%: học N4 chậm hơn, dành 40% thời gian vá N5.",
    "- Nếu dưới 60%: chưa nên ép N4 tháng 7; ưu tiên chắc N5 để tránh mất nền.",
    "",
    "Bước tiếp theo nên làm ngay: nhắn `hãy kiểm tra trình độ N5 của tôi` để Kami tạo quiz chẩn đoán.",
  ].join("\n")
}

async function buildSavedItemsAnswer(userId: string, appState: ChatAppState) {
  const savedItems = await getSavedStudyItems(userId)
  const latestSources = [
    ...(appState.latestAssistantQuiz?.sources ?? []),
    ...appState.latestSources,
  ]
  const matchedSources = latestSources.filter((source) =>
    savedItems.some((item) => item.itemKey === source.id || item.sourceId === source.id || item.sourceId === source.sourceId)
  )

  return [
    "Mình kiểm tra Saved study items trong database:",
    "",
    `Tổng mục lưu gần đây tìm thấy: ${savedItems.length}.`,
    matchedSources.length
      ? `Nguồn gần nhất đã lưu: ${matchedSources.map((source) => source.title).join(", ")}.`
      : "Mình chưa thấy nguồn gần nhất trong Saved study items.",
    savedItems.length
      ? `Các mục mới nhất: ${savedItems.slice(0, 5).map((item) => item.title).join(", ")}.`
      : "Bạn chưa có mục ôn tập đã lưu.",
    "",
    "`Nộp bài` chỉ ghi quiz/progress; `Lưu nguồn` mới ghi Saved study items.",
  ].join("\n")
}

async function buildRecentActivityAnswer(userId: string, appState: ChatAppState) {
  const activities = await getRecentActivity(userId)
  const lines = ["Mình xem hoạt động gần đây:"]

  if (appState.lastActionMessage) lines.push(`Trạng thái UI gần nhất: ${appState.lastActionMessage}`)
  if (!activities.length) {
    lines.push("Database chưa có activity nào gần đây.")
  } else {
    activities.slice(0, 5).forEach((activity, index) => {
      lines.push(`${index + 1}. ${activity.content}${activity.result ? ` - ${activity.result}` : ""} (${formatDateTime(activity.createdAt)})`)
    })
  }

  return lines.join("\n")
}

async function buildSystemCapabilityAnswer(appState: ChatAppState) {
  const [vocabularyTotal, grammarTotal, quizTotal, readingTotal] = await Promise.all([
    prisma.vocabulary.count(),
    prisma.grammar.count(),
    prisma.quizQuestion.count(),
    prisma.newsArticle.count(),
  ])

  return [
    "Mình hiểu. Nếu bạn bắt đầu từ con số 0 để thi N5, app này nên dùng như một bộ học có AI kèm sát bên, không phải chỉ là chatbot hỏi đáp.",
    "",
    "Dữ liệu học hiện có trong hệ thống:",
    `- Từ vựng: ${vocabularyTotal} mục.`,
    `- Ngữ pháp: ${grammarTotal} mẫu.`,
    `- Quiz hệ thống: ${quizTotal} câu.`,
    `- Bài đọc/TODAII đã import: ${readingTotal} bài.`,
    "",
    "Mình có thể hỗ trợ bạn theo các việc chính:",
    "- Giải thích bảng chữ cái, từ vựng, ngữ pháp, câu tiếng Nhật và dịch Nhật - Việt.",
    "- Tạo quiz nhỏ từ dữ liệu thật trong app, chấm bài, giải thích đáp án.",
    "- Nhìn trạng thái quiz đang mở: bạn chọn gì, đã nộp chưa, điểm bao nhiêu.",
    "- Kiểm tra tiến độ, điểm quiz, hoạt động gần đây và mục đã lưu ôn tập.",
    "- Bám bài đọc đang mở để tóm tắt, rút từ vựng/ngữ pháp, tạo câu hỏi đọc hiểu.",
    "",
    "Cách bắt đầu từ số 0:",
    "1. Học Hiragana trước, sau đó Katakana. Đừng học ngữ pháp nặng khi chưa đọc được kana.",
    "2. Mỗi ngày học 5-10 từ N5, ưu tiên từ đời sống: chào hỏi, trường học, đồ vật, thời gian.",
    "3. Học mẫu câu lõi: `N は N です`, câu phủ định, câu hỏi, trợ từ `は/が/を/に/で`.",
    "4. Làm quiz ngắn sau mỗi buổi. Khi bấm `Nộp bài`, app ghi lượt quiz vào progress.",
    "5. Gặp từ/ngữ pháp muốn ôn lại thì bấm `Lưu nguồn`; đó mới là Saved study items.",
    "6. Khi đã quen kana và câu cơ bản, qua Reading để đọc bài ngắn, nghe audio và hỏi mình về `bài này`.",
    "",
    "Bạn có thể nhắn ngay kiểu:",
    "- `Dạy mình Hiragana từ đầu`",
    "- `Tạo cho mình 5 câu quiz từ vựng N5`",
    "- `Giải thích mẫu N は N です`",
    "- `Hôm nay mình nên học gì tiếp?`",
    "",
    `Ngữ cảnh hiện tại mình thấy: bạn đang ở page ${appState.page}, active source: ${appState.activeSource?.title ?? "không có"}.`,
  ].join("\n")
}

function buildNavigationHelpAnswer(appState: ChatAppState) {
  return [
    "Mình có thể hướng dẫn theo màn hình hiện tại:",
    "",
    `Bạn đang ở page: ${appState.page}.`,
    appState.activeSource ? `Nguồn đang active: ${appState.activeSource.title}.` : "Hiện chưa có nguồn active.",
    "",
    "- Muốn lưu nội dung ôn tập: dùng `Lưu nguồn` ở câu trả lời có source.",
    "- Muốn ghi lịch sử học: dùng `Ghi hoạt động`.",
    "- Muốn làm quiz: dùng `Tạo quiz` hoặc yêu cầu trực tiếp trong chat.",
    "- Muốn hỏi về bài đọc: mở bài ở Reading rồi dùng active article hoặc hỏi `bài này...`.",
  ].join("\n")
}

async function buildAgentContext(userId: string, appState: ChatAppState, intents: AgentIntent[]) {
  const lines = [
    "Du lieu he thong da xem:",
    `- UI page: ${appState.page}`,
    `- Active source: ${appState.activeSource ? `${appState.activeSource.type}:${appState.activeSource.title}` : "khong co"}`,
    `- Latest sources: ${appState.latestSources.map((source) => `${source.type}:${source.title}`).join(", ") || "khong co"}`,
    `- Latest action: ${appState.lastActionMessage || "khong co"}`,
  ]

  if (appState.latestAssistantQuiz?.cards.length) {
    lines.push(`- Active quiz: ${appState.latestAssistantQuiz.cards.length} cau; submitted=${Boolean(appState.quizState?.submitted)}`)
    if (appState.quizState?.result) {
      lines.push(`- Active quiz result: ${appState.quizState.result.correctCount}/${appState.quizState.result.total} (${appState.quizState.result.percentage}%)`)
    }
  }

  if (intents.includes("progress_status")) {
    const progress = await getStudyProgress(userId)
    lines.push(`- Progress: vocab learned ${progress.learnedVocabulary}/${progress.totalVocabulary}, review ${progress.reviewVocabulary}, grammar ${progress.completedGrammar}/${progress.totalGrammar}, quiz attempts ${progress.quizAttempts}, avg quiz ${progress.averageQuizScore}%`)
  }

  if (intents.includes("saved_items_status")) {
    const savedItems = await getSavedStudyItems(userId)
    lines.push(`- Saved items gan day: ${savedItems.slice(0, 5).map((item) => item.title).join(", ") || "khong co"}`)
  }

  if (intents.includes("recent_activity")) {
    const activities = await getRecentActivity(userId)
    lines.push(`- Activity gan day: ${activities.slice(0, 3).map((item) => `${item.type}:${item.result ?? item.content}`).join(", ") || "khong co"}`)
  }

  return lines.join("\n")
}

async function buildDeterministicAgentAnswer(userId: string, message: string, appState: ChatAppState, history: ChatHistoryMessage[], intents: AgentIntent[]) {
  if (intents.includes("review_quiz")) {
    const answer = buildQuizStateAnswer(message, appState, history)
    if (answer) return answer
  }

  const parts: string[] = []
  if (intents.includes("progress_status")) parts.push(await buildProgressAnswer(userId, appState))
  if (intents.includes("saved_items_status")) parts.push(await buildSavedItemsAnswer(userId, appState))
  if (intents.includes("recent_activity")) parts.push(await buildRecentActivityAnswer(userId, appState))
  if (intents.includes("system_capability")) parts.push(await buildSystemCapabilityAnswer(appState))
  if (intents.includes("app_navigation_help") && !intents.includes("knowledge_question")) parts.push(buildNavigationHelpAnswer(appState))

  return parts.length ? parts.join("\n\n") : null
}

function latestHistoryContent(history: ChatHistoryMessage[], role: ChatHistoryMessage["role"]) {
  return [...history].reverse().find((item) => item.role === role)?.content
}

function hasUsableLearningContext(history: ChatHistoryMessage[]) {
  const latestUser = latestHistoryContent(history, "user") ?? ""
  const latestAssistant = latestHistoryContent(history, "assistant") ?? ""
  const context = `${latestUser}\n${latestAssistant}`

  if (context.length < 80) return false

  return (
    /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u.test(context) ||
    /\b(n[1-5]|jlpt|ngu phap|tu vung|kanji|hiragana|katakana|romaji|mau cau|cau truc|tro tu|dong tu|tinh tu)\b/i.test(
      normalizeIntentText(context)
    )
  )
}

function buildClarifyingQuizAnswer() {
  return [
    "Bạn muốn tạo câu hỏi về nội dung nào?",
    "",
    "Ví dụ:",
    "- Tạo 5 câu về これ / それ / あれ",
    "- Tạo 4 câu về mẫu N は N です",
    "- Cho tôi bài tập về trợ từ は và が",
  ].join("\n")
}

function buildClarifyingArticleAnswer() {
  return [
    "Bạn muốn hỏi về bài báo nào?",
    "",
    "Hãy mở một bài đọc rồi bấm \"Hỏi AI về bài này\", hoặc nhập tiêu đề bài báo cụ thể.",
  ].join("\n")
}

function buildContextualMessage(message: string, history: ChatHistoryMessage[]) {
  if (
    isLevelDiagnosticRequest(message) ||
    !(isQuizFollowUp(message) || isExplicitCreateQuizRequest(message)) ||
    !history.length
  ) {
    return {
      promptMessage: message,
      retrievalQuery: message,
    }
  }

  const previousUser = latestHistoryContent(history, "user") ?? ""
  const previousAssistant = latestHistoryContent(history, "assistant") ?? ""
  const context = [previousUser, previousAssistant].filter(Boolean).join("\n\n").slice(0, 1800)
  const quizCount = requestedQuizCount(message) ?? 5

  if (!context) {
    return {
      promptMessage: message,
      retrievalQuery: message,
    }
  }

  return {
    promptMessage: [
      message,
      "",
      "Đây là yêu cầu follow-up ngắn. Hãy hiểu là người học muốn chuyển nội dung ngay trước đó thành bài trắc nghiệm, không đổi sang chủ đề mới.",
      "Ngữ cảnh ngay trước đó:",
      `Hay tao dung ${quizCount} cau trac nghiem ve noi dung ngay truoc do. Neu nguoi hoc khong noi ro so cau thi mac dinh la 5 cau.`,
      context,
    ].join("\n"),
    retrievalQuery: `${message}\n${context}`,
  }
}

function buildRetrievalMessage(message: string, activeSource: ActiveChatSource | null) {
  if (!isArticleBrowseRequest(message)) return message

  const normalized = normalizeIntentText(message)
  const excludesActive = activeSource?.type === "news" && /\b(khac|con|nao|moi)\b/.test(normalized)

  return [
    "bai doc bai bao song ngu news article",
    message,
    excludesActive ? `Exclude active article id ${activeSource.id}` : "",
    excludesActive
      ? `Nguoi hoc dang hoi bai doc khac voi bai active hien tai. Khong chi tra loi dua tren bai "${activeSource.title}". Hay tim va liet ke cac bai doc khac trong database neu co.`
      : "Nguoi hoc dang muon tim hoac liet ke bai doc trong database.",
  ].filter(Boolean).join("\n")
}

function shouldExcludeActiveArticle(message: string, activeSource: ActiveChatSource | null) {
  if (activeSource?.type !== "news") return false
  if (!isArticleBrowseRequest(message)) return false
  return /\b(khac|con|nao|moi)\b/.test(normalizeIntentText(message))
}

function createTextResponse({
  textStream,
  fallbackText,
  onComplete,
  headers,
}: {
  textStream: AsyncIterable<string>
  fallbackText: string
  onComplete: (text: string) => Promise<void>
  headers: HeadersInit
}) {
  const encoder = new TextEncoder()
  const firstChunkTimeoutMs = 8000

  const timeoutResult = (ms: number) =>
    new Promise<IteratorResult<string>>((resolve) => {
      setTimeout(() => resolve({ done: true, value: "" }), ms)
    })

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      let finalText = ""
      let sentAnyChunk = false
      const iterator = textStream[Symbol.asyncIterator]()

      try {
        while (true) {
          const result = finalText
            ? await iterator.next()
            : await Promise.race([iterator.next(), timeoutResult(firstChunkTimeoutMs)])
          if (result.done) break

          finalText += result.value
          sentAnyChunk = true
          controller.enqueue(encoder.encode(result.value))
        }

        if (!sentAnyChunk && !isUsefulModelText(finalText)) {
          void iterator.return?.()
          finalText = fallbackText
          controller.enqueue(encoder.encode(finalText))
        }
      } catch (error) {
        const errorText =
          error instanceof Error
            ? `Mình chưa thể tạo câu trả lời từ model lúc này. Lỗi: ${error.message}\n\n${fallbackText}`
            : fallbackText
        finalText = errorText
        controller.enqueue(encoder.encode(errorText))
      } finally {
        controller.close()
        void onComplete(finalText).catch((error) => {
          console.error("Failed to log chat response", error)
        })
      }
    },
  })

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      ...headers,
    },
  })
}

async function logChat({
  userId,
  message,
  answer,
  provider,
  sources,
}: {
  userId: string
  message: string
  answer: string
  provider: "openrouter" | "fallback"
  sources: ReturnType<typeof responseSources>
}) {
  await prisma.chatLog.create({
    data: {
      userId,
      message,
      answer,
      provider,
      sourcesJson: sources,
    },
  })
}

async function persistConversationTurn({
  userId,
  conversationId,
  message,
  answer,
  provider,
  sources,
  quizCards,
}: {
  userId: string
  conversationId?: string | null
  message: string
  answer: string
  provider: "openrouter" | "fallback"
  sources: ReturnType<typeof responseSources>
  quizCards?: ReturnType<typeof quizCardsPayload>
}) {
  const resolvedConversationId = await ensureChatConversation(userId, conversationId, message)
  const userMessageId = await appendChatConversationMessage({
    conversationId: resolvedConversationId,
    userId,
    role: "user",
    content: message,
  })
  const assistantMessageId = await appendChatConversationMessage({
    conversationId: resolvedConversationId,
    userId,
    role: "assistant",
    content: answer,
    provider,
    sources,
    quizCards,
  })

  return {
    conversationId: resolvedConversationId,
    userMessageId,
    assistantMessageId,
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

  const body = (await request.json()) as ChatRequest
  const message = body.message?.trim()
  const history = sanitizeHistory(body.history)
  const activeSource = sanitizeActiveSource(body.activeSource)
  const appState = sanitizeAppState(body.appState, activeSource)
  const effectiveActiveSource = appState.activeSource ?? activeSource
  const requestConversationId = typeof body.conversationId === "string" && body.conversationId.trim() ? body.conversationId.trim() : null

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 })
  }

  if (message.length > 1500) {
    return NextResponse.json({ error: "Message is too long" }, { status: 413 })
  }

  const agentIntents = detectAgentIntents(message, appState, history)

  if (isVagueArticleRequest(message) && !effectiveActiveSource && !isArticleBrowseRequest(message) && !isQuizFollowUp(message)) {
    const answer = buildClarifyingArticleAnswer()
    const sourcePayload: ReturnType<typeof responseSources> = []
    const persisted = await persistConversationTurn({
      userId: user.id,
      conversationId: requestConversationId,
      message,
      answer,
      provider: "fallback",
      sources: sourcePayload,
    })
    await logChat({
      userId: user.id,
      message,
      answer,
      provider: "fallback",
      sources: sourcePayload,
    })

    return NextResponse.json({
      answer,
      provider: "fallback",
      isDeterministic: true,
      sources: sourcePayload,
      ...persisted,
    })
  }

  if (isLevelDiagnosticRequest(message) && process.env.ENABLE_LEGACY_CHAT_BRANCHES === "true") {
    const quizCount = requestedQuizCount(message) ?? 8
    const level = requestedJlptLevel(message)
    const items = await randomVocabularyItems(quizCount)
    const sources = items.map(vocabularySource)
    const sourcePayload = responseSources(sources)
    const answer = items.length
      ? buildLevelDiagnosticQuizAnswer(items, level)
      : "Kami chưa có đủ dữ liệu trong hệ thống để tạo bài kiểm tra trình độ."
    const quizCards = quizCardsPayload(answer, true)
    const persisted = await persistConversationTurn({
      userId: user.id,
      conversationId: requestConversationId,
      message,
      answer,
      provider: "fallback",
      sources: sourcePayload,
      quizCards,
    })
    await logChat({
      userId: user.id,
      message,
      answer,
      provider: "fallback",
      sources: sourcePayload,
    })

    return NextResponse.json({
      answer,
      provider: "fallback",
      isDeterministic: true,
      sources: sourcePayload,
      quizCards,
      activeSource: null,
      ...persisted,
    })
  }

  if (isRandomVocabularyQuizRequest(message) && process.env.ENABLE_LEGACY_CHAT_BRANCHES === "true") {
    const quizCount = requestedQuizCount(message) ?? 3
    const items = await randomVocabularyItems(quizCount)
    const sources = items.map(vocabularySource)
    const sourcePayload = responseSources(sources)
    const answer = items.length
      ? buildRandomVocabularyQuizAnswer(items)
      : "Chua co du lieu tu vung trong he thong de tao quiz."
    const quizCards = quizCardsPayload(answer, true)
    const persisted = await persistConversationTurn({
      userId: user.id,
      conversationId: requestConversationId,
      message,
      answer,
      provider: "fallback",
      sources: sourcePayload,
      quizCards,
    })
    await logChat({
      userId: user.id,
      message,
      answer,
      provider: "fallback",
      sources: sourcePayload,
    })

    return NextResponse.json({
      answer,
      provider: "fallback",
      isDeterministic: true,
      sources: sourcePayload,
      quizCards,
      activeSource: null,
      ...persisted,
    })
  }

  if (isVagueQuizRequest(message) && !effectiveActiveSource && !hasUsableLearningContext(history)) {
    const answer = buildClarifyingQuizAnswer()
    const sourcePayload: ReturnType<typeof responseSources> = []
    const quizCards = quizCardsPayload(answer)
    const persisted = await persistConversationTurn({
      userId: user.id,
      conversationId: requestConversationId,
      message,
      answer,
      provider: "fallback",
      sources: sourcePayload,
      quizCards,
    })
    await logChat({
      userId: user.id,
      message,
      answer,
      provider: "fallback",
      sources: sourcePayload,
    })

    return NextResponse.json({
      answer,
      provider: "fallback",
      isDeterministic: true,
      sources: sourcePayload,
      quizCards,
      ...persisted,
    })
  }

  if (isCasualOrMetaMessage(message)) {
    const answer = buildCasualAnswer(message)
    const sourcePayload: ReturnType<typeof responseSources> = []
    const quizCards = quizCardsPayload(answer)
    const persisted = await persistConversationTurn({
      userId: user.id,
      conversationId: requestConversationId,
      message,
      answer,
      provider: "openrouter",
      sources: sourcePayload,
      quizCards,
    })
    await logChat({
      userId: user.id,
      message,
      answer,
      provider: "openrouter",
      sources: sourcePayload,
    })

    return NextResponse.json({
      answer,
      provider: "openrouter",
      sources: sourcePayload,
      quizCards,
      ...persisted,
    })
  }

  const contextualMessage = buildContextualMessage(message, history)
  const diagnosticRequest = isLevelDiagnosticRequest(message)
  const articleBrowseRequest = isArticleBrowseRequest(message)
  const retrievalMessage = buildRetrievalMessage(
    contextualMessage.retrievalQuery,
    diagnosticRequest ? null : effectiveActiveSource
  )
  const shouldParseQuizCards =
    agentIntents.includes("create_quiz") ||
    isLevelDiagnosticRequest(message) ||
    isQuizFollowUp(message) ||
    isExplicitCreateQuizRequest(message) ||
    isVagueQuizRequest(message)
  const projectAgent = diagnosticRequest
    ? { promptContext: "", sources: [], activeSource: null }
    : await buildProjectAgentContext(retrievalMessage, user.id)
  const agentContext = await buildAgentContext(user.id, appState, [])
  const activeArticle = !diagnosticRequest && shouldUseActiveArticle(message, effectiveActiveSource)
    ? await getActiveArticleContext(effectiveActiveSource)
    : null
  const primarySources = diagnosticRequest
    ? []
    : activeArticle && effectiveActiveSource
      ? [
          {
            id: effectiveActiveSource.id,
            sourceId: effectiveActiveSource.id,
            type: "news" as const,
            title: activeArticle.title,
            href: `/reading?article=${encodeURIComponent(effectiveActiveSource.id)}`,
            content: activeArticle.articleText,
            score: 100,
          },
        ]
      : await retrieveSourcesFromDatabase(
          retrievalMessage,
          6,
          articleBrowseRequest
            ? { preferredTypes: ["news"], requireTypes: ["news"], requireJapaneseTermMatch: true }
            : undefined
        )

  const dedupedSources = new Map<string, (typeof primarySources)[number]>()
  const candidateSources = articleBrowseRequest ? primarySources : [...projectAgent.sources, ...primarySources]
  for (const source of candidateSources) {
    const key = `${source.type}:${source.sourceId ?? source.id}`
    const current = dedupedSources.get(key)
    if (!current || current.score < source.score) {
      dedupedSources.set(key, source)
    }
  }

  const shouldExcludeActive = shouldExcludeActiveArticle(message, effectiveActiveSource)
  let sources = Array.from(dedupedSources.values())
    .filter((source) => !shouldExcludeActive || source.sourceId !== effectiveActiveSource?.id)
    .slice(0, 8)

  if (!sources.length && !articleBrowseRequest && !diagnosticRequest) {
    sources = retrieveSources(retrievalMessage, 6)
  }

  const prompt = buildChatPrompt(
    contextualMessage.promptMessage,
    sources,
    diagnosticRequest ? [] : history,
    activeArticle,
    [agentContext, projectAgent.promptContext].filter(Boolean).join("\n\n"),
    shouldParseQuizCards
  )
  const sourcePayload = responseSources(sources)
  const responseActiveSource = activeArticle && effectiveActiveSource
    ? effectiveActiveSource
    : articleBrowseRequest
      ? activeSourceFromSources(sourcePayload) ?? null
      : projectAgent.activeSource ?? activeSourceFromSources(sourcePayload) ?? effectiveActiveSource
  const apiKey = process.env.OPENROUTER_API_KEY

  if (!apiKey) {
    const answer = diagnosticRequest
      ? await buildDiagnosticQuizFallbackAnswer(message)
      : buildFallbackAnswer(message, sources)
    const quizCards = quizCardsPayload(answer, shouldParseQuizCards)
    const persisted = await persistConversationTurn({
      userId: user.id,
      conversationId: requestConversationId,
      message,
      answer,
      provider: "fallback",
      sources: sourcePayload,
      quizCards,
    })
    await logChat({
      userId: user.id,
      message,
      answer,
      provider: "fallback",
      sources: sourcePayload,
    })

    return NextResponse.json({
      answer,
      provider: "fallback",
      sources: sourcePayload,
      quizCards,
      activeSource: responseActiveSource ?? null,
      ...persisted,
    })
  }

  const openrouter = createOpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    name: "openrouter",
    headers: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-OpenRouter-Title": "Nihongo AI Study",
    },
  })
  const tools = createStudyAgentTools(user)
  const toolChoice = diagnosticRequest ? { type: "tool" as const, toolName: "getDiagnosticQuiz" as const } : "auto"

  try {
    const maxOutputTokens = Number.parseInt(process.env.OPENROUTER_MAX_OUTPUT_TOKENS ?? "700", 10)
    const result = await generateText({
      model: openrouter.chat(process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini"),
      system: nihongoTutorSystemPrompt,
      prompt,
      tools,
      toolChoice,
      stopWhen: stepCountIs(6),
      temperature: 0.25,
      maxOutputTokens: Number.isFinite(maxOutputTokens) ? maxOutputTokens : 700,
    })

    const answer = isUsefulModelText(result.text)
      ? result.text
      : diagnosticRequest
        ? await buildDiagnosticQuizFallbackAnswer(message)
        : buildFallbackAnswer(message, sources)
    const quizCards = quizCardsPayload(answer, shouldParseQuizCards)
    const persisted = await persistConversationTurn({
      userId: user.id,
      conversationId: requestConversationId,
      message,
      answer,
      provider: "openrouter",
      sources: sourcePayload,
      quizCards,
    })

    await logChat({
      userId: user.id,
      message,
      answer,
      provider: "openrouter",
      sources: sourcePayload,
    })

    return NextResponse.json({
      answer,
      provider: "openrouter",
      sources: sourcePayload,
      quizCards,
      activeSource: responseActiveSource ?? null,
      ...persisted,
    })
  } catch (error) {
    console.warn("[chat] OpenRouter unavailable, using fallback answer.", error)
    const fallbackAnswer = diagnosticRequest
      ? await buildDiagnosticQuizFallbackAnswer(message)
      : buildFallbackAnswer(message, sources)
    const quizCards = quizCardsPayload(fallbackAnswer, shouldParseQuizCards)
    const persisted = await persistConversationTurn({
      userId: user.id,
      conversationId: requestConversationId,
      message,
      answer: fallbackAnswer,
      provider: "fallback",
      sources: sourcePayload,
      quizCards,
    })

    await logChat({
      userId: user.id,
      message,
      answer: fallbackAnswer,
      provider: "fallback",
      sources: sourcePayload,
    })

    return NextResponse.json({
      answer: fallbackAnswer,
      provider: "fallback",
      sources: sourcePayload,
      quizCards,
      activeSource: responseActiveSource ?? null,
      ...persisted,
    })
  }
}
