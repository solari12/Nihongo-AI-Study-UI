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
    tools: createStudyAgentTools(user),
    stopWhen: stepCountIs(5),
    temperature: 0.25,
    onFinish: async ({ text }) => {
      await logChat({
        userId: user.id,
        message,
        answer: text,
        provider: "openrouter",
        sources: sourcePayload,
      })
    },
  })

  return result.toTextStreamResponse({
    headers: {
      "x-chat-provider": "openrouter",
      "x-chat-sources": encodeHeaderJson(sourcePayload),
    },
  })
}
