"use client"

import { KeyboardEvent, useMemo, useState } from "react"
import { ChatMessage } from "@/components/app/chat-message"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { readJsonResponse } from "@/lib/http"
import { BookOpen, FileText, HelpCircle, Newspaper, RotateCcw, Send, Sparkles } from "lucide-react"

type ChatSource = {
  id: string
  title: string
  type: "vocabulary" | "grammar" | "quiz" | "news"
  score: number
}

type ChatMessageItem = {
  role: "user" | "assistant"
  content: string
  timestamp: string
  provider?: "openrouter" | "fallback"
  sources?: ChatSource[]
}

type ChatResponse = {
  answer: string
  provider: "openrouter" | "fallback"
  sources: ChatSource[]
}

const suggestedQuestions = [
  "学生 nghĩa là gì? Cho ví dụ dễ nhớ.",
  "Giải thích mẫu câu N は N です cho người mới học.",
  "Phân biệt これ, それ và あれ.",
  "Tôi hay sai trợ từ は và が, nên ôn gì trước?",
  "Tóm tắt bài đọc TODAII gần nhất có nguồn liên quan.",
]

const initialMessages: ChatMessageItem[] = [
  {
    role: "assistant",
    content: [
      "Xin chào, mình là trợ lý học tiếng Nhật của Nihongo AI Study.",
      "",
      "Mình có thể tra cứu kho từ vựng, ngữ pháp, quiz và bài đọc đã import để trả lời kèm nguồn. Bạn có thể hỏi về nghĩa từ, cấu trúc câu, ví dụ, hoặc nhờ gợi ý ôn tập.",
    ].join("\n"),
    timestamp: "Bây giờ",
  },
]

function formatTime() {
  return new Date().toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function sourceLabel(type: ChatSource["type"]) {
  if (type === "grammar") return "Ngữ pháp"
  if (type === "quiz") return "Quiz"
  if (type === "news") return "Bài đọc"
  return "Từ vựng"
}

function sourceIcon(type: ChatSource["type"]) {
  if (type === "grammar") return <FileText className="h-4 w-4 text-success" />
  if (type === "quiz") return <HelpCircle className="h-4 w-4 text-accent" />
  if (type === "news") return <Newspaper className="h-4 w-4 text-primary" />
  return <BookOpen className="h-4 w-4 text-primary" />
}

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return

  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = "vi-VN"
  utterance.rate = 0.95
  window.speechSynthesis.speak(utterance)
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<ChatMessageItem[]>(initialMessages)
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const latestAssistant = [...messages].reverse().find((message) => message.role === "assistant")
  const latestSources = latestAssistant?.sources ?? []
  const todayQuestions = messages.filter((message) => message.role === "user").length
  const providerLabel = latestAssistant?.provider === "openrouter" ? "OpenRouter" : "Fallback nội bộ"
  const sourceCounts = useMemo(() => {
    return latestSources.reduce<Record<string, number>>((counts, source) => {
      counts[source.type] = (counts[source.type] ?? 0) + 1
      return counts
    }, {})
  }, [latestSources])

  async function handleSend(nextMessage = inputValue) {
    const message = nextMessage.trim()
    if (!message || isLoading) return

    const userMessage: ChatMessageItem = {
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

    setMessages((previous) => [...previous, userMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, history }),
      })
      const data = await readJsonResponse<ChatResponse>(response)

      const botResponse: ChatMessageItem = {
        role: "assistant",
        content:
          data.provider === "fallback"
            ? `${data.answer}\n\nGhi chú: câu trả lời này đang dùng fallback vì OpenRouter chưa có phản hồi hoặc chưa cấu hình key.`
            : data.answer,
        timestamp: formatTime(),
        provider: data.provider,
        sources: data.sources,
      }

      setMessages((previous) => [...previous, botResponse])
    } catch {
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: "Mình chưa thể xử lý câu hỏi lúc này. Hãy thử lại sau hoặc hỏi ngắn hơn.",
          timestamp: formatTime(),
          provider: "fallback",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) return
    event.preventDefault()
    void handleSend()
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Sparkles className="h-6 w-6 text-accent" />
              Chatbot AI
            </h1>
            <p className="text-muted-foreground">
              Hỏi đáp tiếng Nhật với RAG từ từ vựng, ngữ pháp, quiz và bài đọc đã import.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => {
              setMessages(initialMessages)
              setInputValue("")
            }}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Xóa hội thoại
          </Button>
        </div>

        <Card className="flex min-h-0 flex-1 flex-col">
          <ScrollArea className="min-h-0 flex-1 p-4">
            <div className="space-y-6">
              {messages.map((message, index) => (
                <ChatMessage
                  key={`${message.role}-${index}`}
                  role={message.role}
                  content={message.content}
                  timestamp={message.timestamp}
                  sources={message.sources}
                  onListen={() => speak(message.content)}
                />
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent">
                    <span className="text-xs font-bold text-accent-foreground">AI</span>
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
                    <div className="flex gap-1 text-muted-foreground">
                      <span className="animate-bounce">•</span>
                      <span className="animate-bounce [animation-delay:0.2s]">•</span>
                      <span className="animate-bounce [animation-delay:0.4s]">•</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="border-t p-4">
            <p className="mb-3 text-sm font-medium text-muted-foreground">Câu hỏi gợi ý</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question) => (
                <Button
                  key={question}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-auto rounded-full px-3 py-1.5 text-xs"
                  onClick={() => void handleSend(question)}
                  disabled={isLoading}
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>

          <div className="border-t p-4">
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
                placeholder="Nhập câu hỏi của bạn... Enter để gửi, Shift+Enter để xuống dòng."
                className="min-h-12 flex-1 resize-none"
                maxLength={1500}
              />
              <Button type="submit" size="icon" disabled={!inputValue.trim() || isLoading}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>

      <div className="hidden w-80 shrink-0 lg:block">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4" />
              Nguồn tham khảo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/35 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Provider</span>
                <Badge variant={latestAssistant?.provider === "openrouter" ? "default" : "secondary"}>
                  {providerLabel}
                </Badge>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-muted-foreground">Câu hỏi hôm nay</span>
                <span className="font-medium">{todayQuestions}</span>
              </div>
            </div>

            {latestSources.length ? (
              latestSources.map((source) => (
                <div key={source.id} className="rounded-lg border p-3 transition-colors hover:bg-muted/50">
                  <div className="flex items-start gap-3">
                    {sourceIcon(source.type)}
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-5">{source.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {sourceLabel(source.type)} · score {source.score}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                Chưa có nguồn nào. Hãy gửi một câu hỏi để hệ thống truy xuất dữ liệu.
              </div>
            )}

            <div className="border-t pt-4">
              <h4 className="mb-2 text-sm font-medium">Nguồn gần nhất</h4>
              <div className="flex flex-wrap gap-2">
                {(["vocabulary", "grammar", "quiz", "news"] as const).map((type) => (
                  <Badge key={type} variant="outline" className="rounded-full">
                    {sourceLabel(type)} {sourceCounts[type] ?? 0}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
