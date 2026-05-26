"use client"

import { useState } from "react"
import { ChatMessage } from "@/components/app/chat-message"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Sparkles, BookOpen, FileText, HelpCircle } from "lucide-react"

const suggestedQuestions = [
  "Giải thích mẫu câu N は N です",
  "Cho tôi 5 ví dụ với từ 学生",
  "Phân biệt は và が ở mức sơ cấp",
  "Tạo quiz nhanh về từ vựng bài 1",
  "Tôi sai nhiều phần động từ, nên ôn gì?",
]

const ragSources = [
  { title: "Minna no Nihongo - Bài 1", type: "Giáo trình" },
  { title: "Từ vựng N5 - Chủ đề Gia đình", type: "Từ vựng" },
  { title: "Ngữ pháp: Trợ từ は và が", type: "Ngữ pháp" },
]

const initialMessages = [
  {
    role: "assistant" as const,
    content: `Xin chào! Tôi là trợ lý AI của Nihongo AI Study. Tôi có thể giúp bạn:

• Giải thích ngữ pháp và từ vựng N5
• Đưa ra ví dụ và cách sử dụng
• Tạo quiz nhanh để luyện tập
• Gợi ý nội dung ôn tập phù hợp

Bạn muốn hỏi gì hôm nay?`,
    timestamp: "10:00",
  },
]

export default function ChatbotPage() {
  const [messages, setMessages] = useState(initialMessages)
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async () => {
    if (!inputValue.trim()) return

    const userMessage = {
      role: "user" as const,
      content: inputValue,
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const botResponse = {
        role: "assistant" as const,
        content: `Câu hỏi hay đấy! Để tôi giải thích cho bạn:

**Mẫu câu "N は N です"** là một trong những cấu trúc cơ bản nhất trong tiếng Nhật.

📝 **Cấu trúc:**
Danh từ 1 + は + Danh từ 2 + です

📖 **Ý nghĩa:**
"N1 là N2" - Dùng để giới thiệu hoặc khẳng định điều gì đó.

✨ **Ví dụ:**
• 私は学生です。(Watashi wa gakusei desu.) = Tôi là sinh viên.
• 田中さんは先生です。(Tanaka-san wa sensei desu.) = Anh Tanaka là giáo viên.
• これは本です。(Kore wa hon desu.) = Đây là sách.

💡 **Lưu ý:**
- は đọc là "wa" (không phải "ha") khi làm trợ từ
- です làm cho câu lịch sự hơn

Bạn có muốn tôi cho thêm ví dụ hoặc tạo quiz về mẫu câu này không?`,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        sources: [
          { title: "Minna no Nihongo - Bài 1", type: "Giáo trình" },
          { title: "Ngữ pháp N5 cơ bản", type: "Ngữ pháp" },
        ],
      }

      setMessages((prev) => [...prev, botResponse])
      setIsLoading(false)
    }, 1500)
  }

  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question)
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Main chat area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-accent" />
            Chatbot AI
          </h1>
          <p className="text-muted-foreground">
            Hỏi đáp về tiếng Nhật N5 với AI
          </p>
        </div>

        {/* Messages */}
        <Card className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-6">
              {messages.map((message, index) => (
                <ChatMessage
                  key={index}
                  role={message.role}
                  content={message.content}
                  timestamp={message.timestamp}
                  sources={(message as any).sources}
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

          {/* Suggested questions */}
          <div className="border-t p-4">
            <p className="text-sm text-muted-foreground mb-3">Câu hỏi gợi ý:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleSuggestedQuestion(question)}
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="border-t p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="flex gap-2"
            >
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
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

      {/* Right sidebar - RAG sources */}
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
              AI sử dụng các nguồn sau để trả lời:
            </p>
            {ragSources.map((source, index) => (
              <div
                key={index}
                className="rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-start gap-3">
                  {source.type === "Giáo trình" ? (
                    <BookOpen className="h-5 w-5 text-primary shrink-0" />
                  ) : source.type === "Ngữ pháp" ? (
                    <FileText className="h-5 w-5 text-success shrink-0" />
                  ) : (
                    <HelpCircle className="h-5 w-5 text-accent shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{source.title}</p>
                    <p className="text-xs text-muted-foreground">{source.type}</p>
                  </div>
                </div>
              </div>
            ))}

            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">Thống kê hội thoại</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Câu hỏi hôm nay</span>
                  <span className="font-medium">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Chủ đề phổ biến</span>
                  <span className="font-medium">Ngữ pháp</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
