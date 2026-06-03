import { NextRequest, NextResponse } from "next/server"
import { createOpenAI } from "@ai-sdk/openai"
import { generateText } from "ai"
import { getCurrentUser } from "@/lib/auth"
import { type ActiveChatSource } from "@/lib/chat/active-source"
import { appendChatConversationMessage, ensureChatConversation } from "@/lib/chat/conversations"
import { buildProjectAgentContext } from "@/lib/chat/project-agent"
import { parseChatQuizCards } from "@/lib/chat/quiz"
import { prisma } from "@/lib/prisma"
import {
  buildChatPrompt,
  nihongoTutorSystemPrompt,
  type ActiveArticleContext,
  type ChatHistoryMessage,
} from "@/lib/rag/chat-prompt"
import { buildFallbackAnswer, retrieveSources, retrieveSourcesFromDatabase } from "@/lib/rag/retriever"

type ChatRequest = {
  message?: string
  history?: ChatHistoryMessage[]
  activeSource?: ActiveChatSource | null
  conversationId?: string | null
}

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
    /\bn[1-5]\b/.test(normalized) ||
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
  if (!isQuizFollowUp(message) || !history.length) {
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
  const requestConversationId = typeof body.conversationId === "string" && body.conversationId.trim() ? body.conversationId.trim() : null

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 })
  }

  if (message.length > 1500) {
    return NextResponse.json({ error: "Message is too long" }, { status: 413 })
  }

  if (isVagueArticleRequest(message) && !activeSource && !isArticleBrowseRequest(message) && !isQuizFollowUp(message)) {
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
      sources: sourcePayload,
      ...persisted,
    })
  }

  if (isVagueQuizRequest(message) && !activeSource && !hasUsableLearningContext(history)) {
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
  const retrievalMessage = buildRetrievalMessage(contextualMessage.retrievalQuery, activeSource)
  const shouldParseQuizCards = isQuizFollowUp(message) || isVagueQuizRequest(message)
  const projectAgent = await buildProjectAgentContext(retrievalMessage, user.id)
  const activeArticle = shouldUseActiveArticle(message, activeSource)
    ? await getActiveArticleContext(activeSource)
    : null
  const primarySources = activeArticle && activeSource
    ? [
        {
          id: activeSource.id,
          sourceId: activeSource.id,
          type: "news" as const,
          title: activeArticle.title,
          href: `/reading?article=${encodeURIComponent(activeSource.id)}`,
          content: activeArticle.articleText,
          score: 100,
        },
      ]
    : await retrieveSourcesFromDatabase(retrievalMessage, 6)

  const dedupedSources = new Map<string, (typeof primarySources)[number]>()
  for (const source of [...projectAgent.sources, ...primarySources]) {
    const key = `${source.type}:${source.sourceId ?? source.id}`
    const current = dedupedSources.get(key)
    if (!current || current.score < source.score) {
      dedupedSources.set(key, source)
    }
  }

  const shouldExcludeActive = shouldExcludeActiveArticle(message, activeSource)
  let sources = Array.from(dedupedSources.values())
    .filter((source) => !shouldExcludeActive || source.sourceId !== activeSource?.id)
    .slice(0, 8)

  if (!sources.length) {
    sources = retrieveSources(retrievalMessage, 6)
  }

  const prompt = buildChatPrompt(
    contextualMessage.promptMessage,
    sources,
    history,
    activeArticle,
    projectAgent.promptContext,
    shouldParseQuizCards
  )
  const sourcePayload = responseSources(sources)
  const responseActiveSource = activeArticle && activeSource
    ? activeSource
    : isArticleBrowseRequest(message)
      ? projectAgent.activeSource ?? activeSourceFromSources(sourcePayload) ?? null
      : projectAgent.activeSource ?? activeSourceFromSources(sourcePayload)
  const apiKey = process.env.OPENROUTER_API_KEY

  if (!apiKey) {
    const answer = buildFallbackAnswer(message, sources)
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

  const result = await generateText({
    model: openrouter(process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini"),
    system: nihongoTutorSystemPrompt,
    prompt,
    temperature: 0.25,
  })

  const answer = isUsefulModelText(result.text) ? result.text : buildFallbackAnswer(message, sources)
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
}
