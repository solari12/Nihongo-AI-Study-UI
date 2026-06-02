import { NextRequest, NextResponse } from "next/server"
import { createOpenAI } from "@ai-sdk/openai"
import { stepCountIs, streamText } from "ai"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  buildChatPrompt,
  nihongoTutorSystemPrompt,
  type ChatHistoryMessage,
} from "@/lib/rag/chat-prompt"
import { buildFallbackAnswer, retrieveSources, retrieveSourcesFromDatabase } from "@/lib/rag/retriever"
import { createStudyAgentTools } from "@/lib/rag/study-agent-tools"

type ChatRequest = {
  message?: string
  history?: ChatHistoryMessage[]
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
    type: source.type,
    title: source.title,
    score: source.score,
  }))
}

function encodeHeaderJson(value: unknown) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url")
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

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      let finalText = ""

      try {
        for await (const chunk of textStream) {
          finalText += chunk
          controller.enqueue(encoder.encode(chunk))
        }

        if (finalText.trim().length < 8) {
          finalText = fallbackText
          controller.enqueue(encoder.encode(fallbackText))
        }

        await onComplete(finalText)
      } catch (error) {
        const errorText =
          error instanceof Error
            ? `Mình chưa thể tạo câu trả lời từ model lúc này. Lỗi: ${error.message}\n\n${fallbackText}`
            : fallbackText
        finalText = errorText
        controller.enqueue(encoder.encode(errorText))
        await onComplete(finalText)
      } finally {
        controller.close()
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

function normalizeIntent(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim()
}

function shouldUseStudyAgentTools(message: string) {
  const normalized = normalizeIntent(message)
  const agentIntentKeywords = [
    "yếu",
    "yeu",
    "ôn",
    "on",
    "lộ trình",
    "lo trinh",
    "kế hoạch",
    "ke hoach",
    "thi",
    "jlpt",
    "n4",
    "n3",
    "n2",
    "n1",
    "hôm nay",
    "hom nay",
    "nên học",
    "nen hoc",
    "tiến độ",
    "tien do",
    "mục tiêu",
    "muc tieu",
    "điểm yếu",
    "diem yeu",
  ]

  return agentIntentKeywords.some((keyword) => normalized.includes(keyword))
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

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

  const body = (await request.json()) as ChatRequest
  const message = body.message?.trim()
  const history = sanitizeHistory(body.history)

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 })
  }

  if (message.length > 1500) {
    return NextResponse.json({ error: "Message is too long" }, { status: 413 })
  }

  let sources = await retrieveSourcesFromDatabase(message, 6)

  if (!sources.length) {
    sources = retrieveSources(message, 6)
  }

  const prompt = buildChatPrompt(message, sources, history)
  const sourcePayload = responseSources(sources)
  const apiKey = process.env.OPENROUTER_API_KEY

  if (!apiKey) {
    const answer = buildFallbackAnswer(message, sources)
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

  const result = streamText({
    model: openrouter(process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini"),
    system: nihongoTutorSystemPrompt,
    prompt,
    ...(shouldUseStudyAgentTools(message)
      ? {
          tools: createStudyAgentTools(user),
          stopWhen: stepCountIs(5),
        }
      : {}),
    temperature: 0.25,
  })

  return createTextResponse({
    textStream: result.textStream,
    fallbackText: buildFallbackAnswer(message, sources),
    onComplete: async (answer) => {
      await logChat({
        userId: user.id,
        message,
        answer,
        provider: "openrouter",
        sources: sourcePayload,
      })
    },
    headers: {
      "x-chat-provider": "openrouter",
      "x-chat-sources": encodeHeaderJson(sourcePayload),
    },
  })
}
