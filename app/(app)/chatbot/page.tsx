"use client"

import { useState } from "react"
import { ChatMessage } from "@/components/app/chat-message"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Sparkles, BookOpen, FileText, HelpCircle } from "lucide-react"
import { readJsonResponse } from "@/lib/http"

type ChatSource = {
  id: string
  title: string
  type: string
  score: number
}

type ChatMessageItem = {
  role: "user" | "assistant"
  content: string
  timestamp: string
  sources?: ChatSource[]
}

type ChatResponse = {
  answer: string
  provider: "openrouter" | "fallback"
  sources: ChatSource[]
}

const suggestedQuestions = [
  "Giải thích mẫu câu N は N です",
  "Cho tôi 5 ví dụ với từ 学生",
  "Phân biệt これ và それ ở mức sơ cấp",
  "水 nghĩa là gì?",
  "Tôi sai nhiều phần trợ từ, nên ôn gì?",
]

const initialMessages: ChatMessageItem[] = [
  {
    role: "assistant",
    content: `Xin chào! Tôi là trợ lý AI của Nihongo AI Study.

Tôi có thể tra cứu dữ liệu N5 trong hệ thống để hỗ trợ:

• Giải thích ngữ pháp và từ vựng
• Đưa ví dụ tiếng Nhật và nghĩa tiếng Việt
• Gợi ý nội dung ôn tập
• Trả lời kèm nguồn tham khảo từ kho dữ liệu

Bạn muốn hỏi gì hôm nay?`,
    timestamp: "10:00",
  },
]

function formatTime() {
  return new Date().toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function sourceIcon(type: string) {
  if (type === "grammar") return <FileText className="h-5 w-5 text-success shrink-0" />
  if (type === "quiz") return <HelpCircle className="h-5 w-5 text-accent shrink-0" />
  return <BookOpen className="h-5 w-5 text-primary shrink-0" />
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState(initialMessages)
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const latestSources = [...messages].reverse().find((message) => message.sources?.length)?.sources ?? []
  const todayQuestions = messages.filter((message) => message.role === "user").length
  const popularTopic = latestSources[0]?.type ?? "Chưa có"

  const handleSend = async () => {
    const message = inputValue.trim()
    if (!message || isLoading) return

    const userMessage: ChatMessageItem = {
      role: "user",
      content: message,
      timestamp: formatTime(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      })
      const data = await readJsonResponse<ChatResponse>(response)

      const botResponse: ChatMessageItem = {
        role: "assistant",
        content:
          data.provider === "fallback"
            ? `${data.answer}\n\n(Ghi chú: hệ thống đang dùng trả lời fallback vì OpenRouter chưa phản hồi hoặc chưa cấu hình key.)`
            : data.answer,
        timestamp: formatTime(),
        sources: data.sources,
      }

      setMessages((prev) => [...prev, botResponse])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Mình chưa thể xử lý câu hỏi lúc này. Hãy thử lại sau.",
          timestamp: formatTime(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      <div className="flex flex-1 flex-col">
        <div className="mb-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-accent" />
            Chatbot AI
          </h1>
          <p className="text-muted-foreground">
            Hỏi đáp tiếng Nhật N5 với RAG và OpenRouter
          </p>
        </div>

        <Card className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-6">
              {messages.map((message, index) => (
                <ChatMessage
                  key={index}
                  role={message.role}
                  content={message.content}
                  timestamp={message.timestamp}
                  sources={message.sources}
                />
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="h-8 w-8 shrink-0 rounded-full bg-accent flex items-center justify-center">
                    <span className="text-xs font-bold text-accent-foreground">AI</span>
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
                    <div className="flex gap-1">
                      <span className="animate-bounce">●</span>
                      <span className="animate-bounce [animation-delay:0.2s]">●</span>
                      <span className="animate-bounce [animation-delay:0.4s]">●</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="border-t p-4">
            <p className="text-sm text-muted-foreground mb-3">Câu hỏi gợi ý:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question) => (
                <Button
                  key={question}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setInputValue(question)}
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
              className="flex gap-2"
            >
              <Input
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder="Nhập câu hỏi của bạn..."
                className="flex-1"
              />
              <Button type="submit" disabled={!inputValue.trim() || isLoading}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>

      <div className="hidden w-80 shrink-0 lg:block">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Nguồn tham khảo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              RAG truy xuất các nguồn sau để tạo câu trả lời:
            </p>
            {latestSources.length ? (
              latestSources.map((source) => (
                <div
                  key={source.id}
                  className="rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start gap-3">
                    {sourceIcon(source.type)}
                    <div>
                      <p className="text-sm font-medium">{source.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {source.type} · score {source.score}
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

            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">Thống kê hội thoại</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Câu hỏi hôm nay</span>
                  <span className="font-medium">{todayQuestions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nguồn gần nhất</span>
                  <span className="font-medium">{popularTopic}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
