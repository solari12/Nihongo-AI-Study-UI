"use client"

import { KeyboardEvent, UIEvent, useEffect, useMemo, useRef, useState } from "react"
import { ChatMessage, type ChatQuizState } from "@/components/app/chat-message"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { CHAT_ACTIVE_SOURCE_STORAGE_KEY, type ActiveChatSource } from "@/lib/chat/active-source"
import { type ChatQuizCard } from "@/lib/chat/quiz"
import { readJsonResponse } from "@/lib/http"
import { useI18n } from "@/lib/i18n"
import { ArrowRight, BookmarkPlus, BookOpen, FileText, HelpCircle, MessageSquare, Newspaper, Plus, Send, Square, Trash2, Volume2, X } from "lucide-react"

type ChatSource = {
  id: string
  sourceId?: string
  title: string
  href?: string
  type: "vocabulary" | "grammar" | "quiz" | "news"
  score: number
}

type ChatMessageItem = {
  id?: string
  role: "user" | "assistant"
  content: string
  timestamp: string
  provider?: "openrouter" | "fallback"
  sources?: ChatSource[]
  quizCards?: ChatQuizCard[]
  quizState?: ChatQuizState
  isStreaming?: boolean
}

type ChatResponse = {
  answer: string
  provider: "openrouter" | "fallback"
  sources: ChatSource[]
  quizCards?: ChatQuizCard[]
  activeSource?: ActiveChatSource | null
  isDeterministic?: boolean
  conversationId: string
  userMessageId: string
  assistantMessageId: string
}

type QuizSubmitResult = {
  correctCount: number
  total: number
  percentage: number
  answeredCount: number
  wrongCount: number
  userAnswers: Record<string, string>
  submittedAt: string
  jlptLevel?: string
  quizId?: string
  articleId?: string
}

type ChatAppState = {
  page: "chatbot"
  activeSource?: ActiveChatSource | null
  latestSources?: ChatSource[]
  latestAssistantQuiz?: {
    messageId?: string
    cards: ChatQuizCard[]
    sources?: ChatSource[]
  } | null
  quizState?: ChatQuizState | null
  lastActionMessage?: string | null
}

type ChatConversationSummary = {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messageCount: number
  lastMessage: string | null
}

type StoredChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  provider?: "openrouter" | "fallback" | null
  sources?: ChatSource[] | null
  quizCards?: ChatQuizCard[] | null
  quizState?: ChatQuizState | null
  createdAt: string
}

type ReadingArticleSummary = {
  id: string
  title: string
  level: string | null
  audioUrl?: string | null
}

const chatAutoScrollThreshold = 120

function formatTime() {
  return new Date().toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatTimeFromIso(value: string) {
  return new Date(value).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function sourceLabel(type: ChatSource["type"], t: ReturnType<typeof useI18n>["t"]) {
  if (type === "grammar") return t("chatbot.source.grammar")
  if (type === "quiz") return t("chatbot.source.quiz")
  if (type === "news") return t("chatbot.source.news")
  return t("chatbot.source.vocabulary")
}

function sourceIcon(type: ChatSource["type"]) {
  if (type === "grammar") return <FileText className="h-4 w-4 text-success" />
  if (type === "quiz") return <HelpCircle className="h-4 w-4 text-accent" />
  if (type === "news") return <Newspaper className="h-4 w-4 text-primary" />
  return <BookOpen className="h-4 w-4 text-primary" />
}

function sourceHref(source: ChatSource) {
  if (source.href) return source.href

  const sourceId = source.sourceId ?? source.id
  const numericId = sourceId.match(/\d+/)?.[0]

  if (source.type === "news") return `/reading?article=${encodeURIComponent(sourceId)}`
  if (source.type === "grammar") return numericId ? `/grammar?grammar=${numericId}` : "/grammar"
  if (source.type === "vocabulary") return numericId ? `/vocabulary?word=${numericId}` : "/vocabulary"
  if (source.type === "quiz") return numericId ? `/quiz?question=${numericId}` : "/quiz"

  return undefined
}

function latestAssistantQuizState(messages: ChatMessageItem[]) {
  const latestQuiz = [...messages]
    .reverse()
    .find((message) => message.role === "assistant" && message.quizCards?.length)

  if (!latestQuiz?.quizCards?.length) return null

  return {
    latestAssistantQuiz: {
      messageId: latestQuiz.id,
      cards: latestQuiz.quizCards,
      sources: latestQuiz.sources,
    },
    quizState: latestQuiz.quizState ?? null,
  }
}

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return

  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = "vi-VN"
  utterance.rate = 0.95
  window.speechSynthesis.speak(utterance)
}

function decodeHeaderJson<T>(value: string | null, fallback: T) {
  if (!value) return fallback

  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
    const decoded = decodeURIComponent(
      Array.from(atob(normalized))
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join("")
    )

    return JSON.parse(decoded) as T
  } catch {
    return fallback
  }
}

function isNearScrollBottom(element: HTMLElement) {
  return element.scrollHeight - element.scrollTop - element.clientHeight <= chatAutoScrollThreshold
}

function sourceFromActiveSource(activeSource: ActiveChatSource): ChatSource {
  return {
    id: activeSource.id,
    sourceId: activeSource.id,
    title: activeSource.title,
    href: activeSource.type === "news" ? `/reading?article=${activeSource.id}` : undefined,
    type: activeSource.type,
    score: 100,
  }
}

export default function ChatbotPage({ compact = false }: { compact?: boolean } = {}) {
  const { t } = useI18n()
  const initialMessages = useMemo<ChatMessageItem[]>(
    () => [
      {
        role: "assistant",
        content: [t("chatbot.welcome.title"), "", t("chatbot.welcome.description")].join("\n"),
        timestamp: t("chatbot.now"),
      },
    ],
    [t]
  )
  const [messages, setMessages] = useState<ChatMessageItem[]>(initialMessages)
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [actionMessage, setActionMessage] = useState("")
  const [activeSource, setActiveSource] = useState<ActiveChatSource | null>(null)
  const [activeArticle, setActiveArticle] = useState<ReadingArticleSummary | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<ChatConversationSummary[]>([])
  const [loadingConversations, setLoadingConversations] = useState(true)
  const abortControllerRef = useRef<AbortController | null>(null)
  const messagesViewportRef = useRef<HTMLDivElement | null>(null)
  const shouldStickToBottomRef = useRef(true)
  const forceScrollToBottomRef = useRef(true)

  function scrollMessagesToBottom(behavior: ScrollBehavior = "smooth") {
    window.requestAnimationFrame(() => {
      const viewport = messagesViewportRef.current
      if (!viewport) return

      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior,
      })
    })
  }

  function handleMessagesScroll(event: UIEvent<HTMLDivElement>) {
    shouldStickToBottomRef.current = isNearScrollBottom(event.currentTarget)
  }

  async function refreshConversations() {
    const response = await fetch("/api/chat/conversations", { cache: "no-store" })
    const data = await readJsonResponse<{ items: ChatConversationSummary[] }>(response)
    setConversations(data.items)
    return data.items
  }

  async function openConversation(id: string) {
    const response = await fetch(`/api/chat/conversations/${id}`, { cache: "no-store" })
    const data = await readJsonResponse<{
      conversation: ChatConversationSummary
      messages: StoredChatMessage[]
    }>(response)

    setConversationId(data.conversation.id)
    forceScrollToBottomRef.current = true
    setMessages(
      data.messages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        timestamp: formatTimeFromIso(message.createdAt),
        provider: message.provider ?? undefined,
        sources: message.sources ?? undefined,
        quizCards: message.quizCards ?? undefined,
        quizState: message.quizState ?? undefined,
      }))
    )
    setActionMessage("")
  }

  useEffect(() => {
    let cancelled = false

    async function loadLatestConversation() {
      try {
        const items = await refreshConversations()
        if (cancelled) return
        if (items[0]) {
          await openConversation(items[0].id)
        }
      } catch (error) {
        if (!cancelled) {
          setActionMessage(
            error instanceof Error
              ? `${t("chatbot.history.loadError")} ${error.message}`
              : t("chatbot.history.loadError")
          )
        }
      } finally {
        if (!cancelled) setLoadingConversations(false)
      }
    }

    void loadLatestConversation()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const stored = window.sessionStorage.getItem(CHAT_ACTIVE_SOURCE_STORAGE_KEY)
    if (!stored) return

    try {
      const parsed = JSON.parse(stored) as ActiveChatSource
      if (parsed.type && parsed.id && parsed.title) {
        setActiveSource(parsed)
        setActionMessage(`${t("chatbot.activeArticle")}: ${parsed.title}`)
      }
    } catch {
      window.sessionStorage.removeItem(CHAT_ACTIVE_SOURCE_STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    if (activeSource) {
      window.sessionStorage.setItem(CHAT_ACTIVE_SOURCE_STORAGE_KEY, JSON.stringify(activeSource))
      return
    }

    window.sessionStorage.removeItem(CHAT_ACTIVE_SOURCE_STORAGE_KEY)
  }, [activeSource])

  useEffect(() => {
    let cancelled = false

    async function loadActiveArticle() {
      if (activeSource?.type !== "news") {
        setActiveArticle(null)
        return
      }

      try {
        const response = await fetch("/api/reading", { cache: "no-store" })
        const data = await readJsonResponse<{ items: ReadingArticleSummary[] }>(response)
        if (cancelled) return

        const article = data.items.find((item) => item.id === activeSource.id)
        setActiveArticle(article ?? { id: activeSource.id, title: activeSource.title, level: null })
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load active reading article", error)
          setActiveArticle({ id: activeSource.id, title: activeSource.title, level: null })
        }
      }
    }

    void loadActiveArticle()

    return () => {
      cancelled = true
    }
  }, [activeSource])

  useEffect(() => {
    if (!forceScrollToBottomRef.current && !shouldStickToBottomRef.current) return

    const behavior = forceScrollToBottomRef.current ? "auto" : "smooth"
    forceScrollToBottomRef.current = false
    scrollMessagesToBottom(behavior)
  }, [messages, isLoading])

  const chatStats = useMemo(() => {
    const assistantWithProvider = [...messages]
      .reverse()
      .find((message) => message.role === "assistant" && message.provider && !message.isStreaming)
    const activeSourceItem = activeSource ? sourceFromActiveSource(activeSource) : null
    const assistantSources = assistantWithProvider?.sources ?? []
    const sources = activeSourceItem
      ? [
          activeSourceItem,
          ...assistantSources.filter(
            (source) => source.id !== activeSourceItem.id && source.sourceId !== activeSourceItem.id
          ),
        ]
      : assistantSources
    const counts = sources.reduce<Record<ChatSource["type"], number>>(
      (nextCounts, source) => {
        nextCounts[source.type] = (nextCounts[source.type] ?? 0) + 1
        return nextCounts
      },
      {
        vocabulary: 0,
        grammar: 0,
        quiz: 0,
        news: 0,
      }
    )
    const questionCount = messages.filter((message) => message.role === "user").length
    const hasConversationActivity = questionCount > 0 || Boolean(activeSource) || Boolean(conversationId)

    return {
      assistant: assistantWithProvider,
      providerLabel:
        assistantWithProvider?.provider === "openrouter"
          ? t("chatbot.provider.ready")
          : assistantWithProvider?.provider === "fallback"
            ? t("chatbot.provider.fallback")
            : hasConversationActivity
              ? t("chatbot.provider.ready")
              : t("chatbot.provider.none"),
      questionCount: Math.max(questionCount, activeSource ? 1 : 0),
      sources,
      sourceCounts: counts,
    }
  }, [activeSource, conversationId, messages, t])

  async function handleSend(nextMessage = inputValue) {
    const message = nextMessage.trim()
    if (!message || isLoading) return
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`

    const userMessage: ChatMessageItem = {
      id: `user-${requestId}`,
      role: "user",
      content: message,
      timestamp: formatTime(),
    }

    const history = messages
      .filter((item) => item.role === "user" || item.role === "assistant")
      .slice(-6)
      .map((item) => ({
        role: item.role,
        content: item.content,
      }))
    const latestQuiz = latestAssistantQuizState(messages)
    const latestAssistant = [...messages].reverse().find((item) => item.role === "assistant")
    const appState: ChatAppState = {
      page: "chatbot",
      activeSource,
      latestSources: latestAssistant?.sources ?? [],
      latestAssistantQuiz: latestQuiz?.latestAssistantQuiz ?? null,
      quizState: latestQuiz?.quizState ?? null,
      lastActionMessage: actionMessage || null,
    }

    const abortController = new AbortController()
    abortControllerRef.current = abortController
    forceScrollToBottomRef.current = true
    shouldStickToBottomRef.current = true
    setMessages((previous) => [...previous, userMessage])
    setInputValue("")
    setActionMessage("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, history, activeSource, conversationId, appState }),
        signal: abortController.signal,
      })

      const streamProvider = response.headers.get("x-chat-provider")

      if (false && streamProvider === "openrouter" && response.body) {
        const streamedSources = decodeHeaderJson<ChatSource[]>(response.headers.get("x-chat-sources"), [])
        const assistantMessageId = `assistant-${requestId}`

        setMessages((previous) => [
          ...previous,
          {
            id: assistantMessageId,
            role: "assistant",
            content: "",
            timestamp: formatTime(),
            provider: "openrouter",
            sources: streamedSources,
            isStreaming: true,
          },
        ])

        const reader = response.body!.getReader()
        const decoder = new TextDecoder()
        let streamedText = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          streamedText += decoder.decode(value, { stream: true })
          setMessages((previous) => {
            return previous.map((item) => {
              if (item.id !== assistantMessageId) return item
              return {
                ...item,
                content: streamedText,
                isStreaming: true,
              }
            })
          })
        }

        streamedText += decoder.decode()

        if (streamedText.trim().length < 8) {
          setMessages((previous) => {
            return previous.map((item) => {
              if (item.id !== assistantMessageId) return item
              return {
                ...item,
                content: t("chatbot.streamEmpty"),
                provider: "fallback",
                isStreaming: false,
              }
            })
          })
          return
        }

        setMessages((previous) => {
          return previous.map((item) => {
            if (item.id !== assistantMessageId) return item
            return {
              ...item,
              content: streamedText,
              isStreaming: false,
            }
          })
        })

        return
      }

      const data = await readJsonResponse<ChatResponse>(response)
      const botResponse: ChatMessageItem = {
        id: `assistant-${requestId}`,
        role: "assistant",
        content:
          data.provider === "fallback" && !data.isDeterministic
            ? `${data.answer}\n\n${t("chatbot.fallbackNote")}`
            : data.answer,
        timestamp: formatTime(),
        provider: data.provider,
        sources: data.sources,
        quizCards: data.quizCards,
      }

      if (data.activeSource !== undefined) {
        setActiveSource(data.activeSource)
      }
      setConversationId(data.conversationId)

      setMessages((previous) => [
        ...previous.map((item) => (item.id === userMessage.id ? { ...item, id: data.userMessageId } : item)),
        {
          ...botResponse,
          id: data.assistantMessageId,
        },
      ])
      void refreshConversations().catch((error) => {
        console.error("Failed to refresh chat conversations", error)
      })
    } catch (error) {
      if (abortController.signal.aborted) {
        setMessages((previous) => [
          ...previous,
          {
            role: "assistant",
            content: t("chatbot.stopped"),
            timestamp: formatTime(),
            provider: "fallback",
          },
        ])
        return
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? `${t("chatbot.errorWithMessage")} ${error.message}`
              : t("chatbot.errorFallback"),
          timestamp: formatTime(),
          provider: "fallback",
        },
      ])
    } finally {
      abortControllerRef.current = null
      setIsLoading(false)
    }
  }

  function stopStreaming() {
    abortControllerRef.current?.abort()
  }

  async function saveFirstSource(message: ChatMessageItem) {
    const source = message.sources?.find((item) => ["news", "vocabulary", "grammar"].includes(item.type))
    if (!source) {
      setActionMessage(t("chatbot.saveSourceMissing"))
      return
    }

    if (!window.confirm(`Lưu "${source.title}" vào ôn tập?`)) return
    const savedType = source.type === "grammar" ? "grammar" : "vocabulary"

    const response = await fetch("/api/saved-study-items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: savedType,
        sourceType: "chatbot-agent",
        sourceId: source.sourceId ?? source.id,
        itemKey: source.sourceId ?? source.id,
        title: source.title,
        level: source.type === "news" ? "reading" : undefined,
        note: t("chatbot.saveSourceNote"),
        rawPayload: {
          source,
          assistantContent: message.content,
        },
      }),
    })
    await readJsonResponse(response)
    setActionMessage(`${t("chatbot.saveSourcePrefix")} "${source.title}" ${t("chatbot.saveSourceSuffix")}`)
  }

  function createMiniQuiz(message: ChatMessageItem) {
    if (!window.confirm(t("chatbot.createQuizConfirm"))) return

    const readingSources = message.sources?.filter((source) => source.type === "news") ?? []
    const targetSource =
      activeSource ??
      readingSources[0] ??
      message.sources?.find((source) => ["vocabulary", "grammar"].includes(source.type))
    const targetTitle = targetSource?.title ?? t("chatbot.quizSourceFallback")
    const prefix = readingSources.length > 1 && !activeSource
      ? `Hãy tạo mini quiz 5 câu trắc nghiệm từ bài đọc đầu tiên: ${targetTitle}.`
      : `${t("chatbot.createQuizPromptPrefix")} ${targetTitle}.`

    void handleSend(`${prefix} ${t("chatbot.createQuizPromptSuffix")}`)
  }

  function activeArticleMessage(): ChatMessageItem | null {
    if (activeSource?.type !== "news") return null

    return {
      role: "assistant",
      content: activeSource.title,
      timestamp: formatTime(),
      sources: [sourceFromActiveSource(activeSource)],
    }
  }

  function saveActiveArticle() {
    const message = activeArticleMessage()
    if (!message) return
    void saveFirstSource(message)
  }

  function createQuizFromActiveArticle() {
    const message = activeArticleMessage()
    if (message) {
      createMiniQuiz(message)
      return
    }

    void handleSend(t("chatbot.suggestion.readingQuiz"))
  }

  async function logChatActivity(message: ChatMessageItem) {
    if (!window.confirm(t("chatbot.logActivityConfirm"))) return

    const response = await fetch("/api/activity", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "chatbot",
        content: `Kami: ${message.content.slice(0, 180)}`,
        topic: "Kami",
        result: t("chatbot.activityResultLearned"),
        durationMinutes: 5,
      }),
    })
    await readJsonResponse(response)
    setActionMessage(t("chatbot.activitySaved"))
  }

  async function logQuizActivity(message: ChatMessageItem, result: QuizSubmitResult) {
    if (!result.answeredCount || !Object.keys(result.userAnswers).length) {
      throw new Error("Quiz submit is missing valid answers.")
    }

    const quizMetadata = [
      `article_id=${result.articleId ?? "chatbot"}`,
      `quiz_id=${result.quizId ?? message.id ?? "chatbot-quiz"}`,
      `total_questions=${result.total}`,
      `answered_questions=${result.answeredCount}`,
      `correct_count=${result.correctCount}`,
      `wrong_count=${result.wrongCount}`,
      `score_percent=${result.percentage}`,
      `user_answers=${JSON.stringify(result.userAnswers)}`,
      `submitted_at=${result.submittedAt}`,
      `jlpt_level=${result.jlptLevel ?? "unknown"}`,
    ].join("; ")

    const [activityResponse, progressResponse] = await Promise.all([
      fetch("/api/activity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "chatbot_quiz",
          content: `Kami quiz: ${message.content.slice(0, 180)} | ${quizMetadata}`,
          topic: "Kami",
          result: `${result.correctCount}/${result.total} ${t("chatbot.correctUnit")} (${result.answeredCount}/${result.total} answered)`,
          score: result.percentage,
          durationMinutes: 5,
        }),
      }),
      fetch("/api/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "quiz_attempt",
          quizType: "vocabulary",
          score: result.correctCount,
          total: result.total,
          percentage: result.percentage,
        }),
      }),
    ])

    await readJsonResponse(activityResponse)
    await readJsonResponse(progressResponse)
    setActionMessage(
      `${t("chatbot.quizSavePrefix")} ${result.correctCount}/${result.total} ${t("chatbot.correctUnit")} (${result.percentage}%).`
    )
  }

  function startNewChat() {
    setConversationId(null)
    forceScrollToBottomRef.current = true
    setMessages(initialMessages)
    setInputValue("")
    setActionMessage(t("chatbot.newStarted"))
    setActiveSource(null)
  }

  async function deleteConversation(id: string) {
    if (!window.confirm(t("chatbot.history.deleteOneConfirm"))) return

    const response = await fetch(`/api/chat/conversations/${id}`, {
      method: "DELETE",
    })
    await readJsonResponse(response)
    const items = await refreshConversations()

    if (conversationId === id) {
      if (items[0]) {
        await openConversation(items[0].id)
      } else {
        startNewChat()
      }
    }
  }

  async function deleteAllConversations() {
    if (!window.confirm(t("chatbot.history.deleteAllConfirm"))) return

    const response = await fetch("/api/chat/conversations", {
      method: "DELETE",
    })
    await readJsonResponse(response)
    setConversations([])
    startNewChat()
  }

  async function updateQuizState(message: ChatMessageItem, quizState: ChatQuizState) {
    if (!message.id) return

    setMessages((previous) =>
      previous.map((item) => (item.id === message.id ? { ...item, quizState } : item))
    )

    if (!conversationId) return

    const response = await fetch(`/api/chat/conversations/${conversationId}/messages/${message.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ quizState }),
    })
    await readJsonResponse(response)
  }

  function quickActionsForMessage(message: ChatMessageItem) {
    const hasQuiz = Boolean(message.quizCards?.length)
    const hasReadingSource = Boolean(message.sources?.some((source) => source.type === "news"))
    const hasStudySource = Boolean(message.sources?.some((source) => ["news", "vocabulary", "grammar"].includes(source.type)))

    if (message.role !== "assistant" || message.isStreaming || hasQuiz) {
      return {
        showActions: false,
      }
    }

    if (hasReadingSource) {
      return {
        showActions: true,
        listenLabel: t("chatbot.action.listenReading"),
        saveLabel: t("chatbot.action.saveArticle"),
        createQuizLabel: t("chatbot.action.createQuizFromArticle"),
        onListen: () => speak(message.content),
        onSave: () => void saveFirstSource(message),
        onCreateQuiz: () => createMiniQuiz(message),
      }
    }

    if (hasStudySource) {
      return {
        showActions: true,
        saveLabel: t("chatbot.action.saveSource"),
        createQuizLabel: t("chatbot.action.createQuiz"),
        onSave: () => void saveFirstSource(message),
        onCreateQuiz: () => createMiniQuiz(message),
      }
    }

    return {
      showActions: false,
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) return
    event.preventDefault()
    void handleSend()
  }

  return (
    <div
      className={
        compact
          ? "flex h-full min-h-0 flex-col rounded-2xl bg-[#fff7ef] bg-[url('/assets/paper-card-bg-clean.png')] bg-cover bg-center p-3"
          : "flex h-[calc(100vh-8rem)] flex-col gap-4 rounded-xl bg-[#fff7ef] bg-[url('/assets/paper-card-bg-clean.png')] bg-cover bg-center p-3 md:flex-row md:gap-6"
      }
    >
      <aside className={compact ? "hidden" : "w-full shrink-0 md:w-72"}>
        <Card className="flex max-h-72 flex-col border-[#ead7c9] bg-white/90 shadow-sm md:h-full md:max-h-none">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4" />
                {t("chatbot.history.title")}
              </CardTitle>
              <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={startNewChat}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col gap-3">
            <ScrollArea className="min-h-0 flex-1 pr-2">
              <div className="space-y-2">
                {loadingConversations ? (
                  <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                    {t("chatbot.history.loading")}
                  </div>
                ) : conversations.length ? (
                  conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`group rounded-lg border p-2 transition ${
                        conversation.id === conversationId ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                      }`}
                    >
                      <button
                        type="button"
                        className="w-full text-left"
                        onClick={() => void openConversation(conversation.id)}
                        disabled={isLoading}
                      >
                        <div className="line-clamp-1 text-sm font-medium">{conversation.title}</div>
                        <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                          {conversation.lastMessage ?? `${conversation.messageCount} ${t("chatbot.messageUnit")}`}
                        </div>
                      </button>
                      <div className="mt-2 flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => void deleteConversation(conversation.id)}
                          disabled={isLoading}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                    {t("chatbot.history.empty")}
                  </div>
                )}
              </div>
            </ScrollArea>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 text-destructive hover:text-destructive"
              onClick={() => void deleteAllConversations()}
              disabled={!conversations.length || isLoading}
            >
              <Trash2 className="h-4 w-4" />
              {t("chatbot.history.deleteAll")}
            </Button>
          </CardContent>
        </Card>
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className={compact ? "mb-3 flex items-center justify-between gap-3" : "mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"}>
          <div>
            <h1 className={compact ? "flex items-center gap-2 text-lg font-bold" : "flex items-center gap-2 text-2xl font-bold"}>
              <img src="/assets/kami-logo.png" alt="" className={compact ? "h-7 w-7 object-contain" : "h-8 w-8 object-contain"} aria-hidden="true" />
              {t("chatbot.title")}
            </h1>
            <p className={compact ? "line-clamp-1 text-xs text-muted-foreground" : "text-muted-foreground"}>
              {t("chatbot.description")}
            </p>
          </div>
          <div className="flex gap-2">
            {isLoading && (
              <Button type="button" variant="outline" size="sm" className="w-fit" onClick={stopStreaming}>
                <Square className="mr-2 h-4 w-4" />
                {t("chatbot.stop")}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={startNewChat}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("chatbot.new")}
            </Button>
          </div>
        </div>

        {activeSource && (
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border bg-muted/35 px-3 py-2 text-sm">
            <Badge variant="secondary" className="gap-1 rounded-full">
              {activeSource.type === "news" ? <Newspaper className="h-3.5 w-3.5" /> : <BookOpen className="h-3.5 w-3.5" />}
              {t("chatbot.activeSource")}: {activeSource.title}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs text-muted-foreground"
              onClick={() => {
                setActiveSource(null)
                setActionMessage(t("chatbot.sourceCleared"))
              }}
            >
              <X className="h-3.5 w-3.5" />
              {t("chatbot.clearSource")}
            </Button>
          </div>
        )}

        {actionMessage && (
          <div className="mb-3 rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            {actionMessage}
          </div>
        )}

        <Card className="relative flex min-h-0 flex-1 flex-col border-[#ead7c9] bg-white/95 shadow-sm">
          <ScrollArea
            className={compact ? "min-h-0 flex-1 p-3" : "min-h-0 flex-1 p-4"}
            viewportRef={messagesViewportRef}
            onViewportScroll={handleMessagesScroll}
          >
            <div className="space-y-6">
              {messages.map((message, index) => {
                const quickActions = quickActionsForMessage(message)

                return (
                  <ChatMessage
                    key={message.id ?? `${message.role}-${index}`}
                    role={message.role}
                    content={message.content || (message.provider === "openrouter" ? t("chatbot.answering") : "")}
                    timestamp={message.timestamp}
                    sources={message.isStreaming ? undefined : message.sources}
                    quizCards={message.isStreaming ? undefined : message.quizCards}
                    quizState={message.quizState}
                    showActions={quickActions.showActions}
                    listenLabel={quickActions.listenLabel}
                    saveLabel={quickActions.saveLabel}
                    createQuizLabel={quickActions.createQuizLabel}
                    onListen={quickActions.onListen}
                    onSave={quickActions.onSave}
                    onCreateQuiz={quickActions.onCreateQuiz}
                    onQuizSubmit={(result) => logQuizActivity(message, result)}
                    onQuizStateChange={(state) => void updateQuizState(message, state)}
                  />
                )
              })}
              {isLoading && !messages[messages.length - 1]?.provider && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#ffe7e4]">
                    <img src="/assets/kami-logo.png" alt="Kami" className="h-full w-full object-contain p-0.5" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
                    <div className="text-sm text-muted-foreground">
                      {t("chatbot.agent.loading")}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className={compact ? "relative border-t border-[#ead7c9] bg-[#fffaf6] p-3" : "relative border-t border-[#ead7c9] bg-[#fffaf6] p-4"}>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                void handleSend()
              }}
              className="flex items-end gap-2"
            >
              <Textarea
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("chatbot.input.placeholder")}
                className="min-h-12 flex-1 resize-none border-[#f0c4c0] bg-white focus-visible:ring-[#e96f78]/35"
                maxLength={1500}
              />
              <Button
                type="submit"
                size="icon"
                className="bg-[#e96f78] text-white shadow-sm shadow-[#e96f78]/25 hover:bg-[#d94f5b] disabled:bg-[#f2b4b8] disabled:text-white"
                disabled={!inputValue.trim() || isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>

      <div className={compact ? "hidden" : "hidden w-80 shrink-0 lg:block"}>
        <Card className="h-full border-[#ead7c9] bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4" />
              {t("chatbot.sources.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeSource?.type === "news" && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                <div className="flex items-start gap-3">
                  <Newspaper className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                      {t("chatbot.reading.current")}
                    </p>
                    <a
                      href={`/reading?article=${activeSource.id}`}
                      className="mt-1 block text-sm font-semibold leading-5 text-foreground hover:text-primary hover:underline"
                    >
                      {activeSource.title}
                    </a>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="rounded-full">
                        {t("chatbot.reading.level")}: {activeArticle?.level ?? t("chatbot.reading.levelUnknown")}
                      </Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => {
                          if (activeArticle?.audioUrl) {
                            window.open(activeArticle.audioUrl, "_blank", "noopener,noreferrer")
                            return
                          }

                          void handleSend(t("chatbot.suggestion.readingListen"))
                        }}
                        disabled={isLoading}
                      >
                        <Volume2 className="mr-1 h-3 w-3" />
                        {t("chatbot.action.listen")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={saveActiveArticle}
                        disabled={isLoading}
                      >
                        <BookmarkPlus className="mr-1 h-3 w-3" />
                        {t("chatbot.action.saveShort")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={createQuizFromActiveArticle}
                        disabled={isLoading}
                      >
                        <HelpCircle className="mr-1 h-3 w-3" />
                        {t("chatbot.action.quizShort")}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {chatStats.sources.length ? (
              <div className="space-y-2">
                {chatStats.sources.map((source) => {
                  const href = sourceHref(source)

                  return href ? (
                  <a
                    key={source.id}
                    href={href}
                    className="group block rounded-xl border border-[#ead7c9] bg-[#fffaf6] p-3 transition-colors hover:border-[#e96f78]/50 hover:bg-[#fff3ef]"
                  >
                    <div className="flex items-start gap-3">
                      {sourceIcon(source.type)}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-5">{source.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {sourceLabel(source.type, t)}
                        </p>
                      </div>
                      <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-[#d94f5b]" />
                    </div>
                  </a>
                ) : (
                  <div key={source.id} className="rounded-xl border border-[#ead7c9] bg-[#fffaf6] p-3">
                    <div className="flex items-start gap-3">
                      {sourceIcon(source.type)}
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-5">{source.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {sourceLabel(source.type, t)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-[#ead7c9] bg-[#fffaf6] p-4 text-sm text-muted-foreground">
                {t("chatbot.sources.empty")}
              </div>
            )}

            {(isLoading || chatStats.assistant) && (
              <div className="rounded-lg border bg-muted/25 px-3 py-2 text-xs text-muted-foreground">
                {isLoading ? (
                  t("chatbot.agent.toolsLoading")
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <span>{t("chatbot.provider.label")}</span>
                    <span className="font-medium text-foreground">{chatStats.providerLabel}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
