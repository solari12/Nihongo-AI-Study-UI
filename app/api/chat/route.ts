import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  buildChatPrompt,
  nihongoTutorSystemPrompt,
  type ChatHistoryMessage,
} from "@/lib/rag/chat-prompt"
import { buildFallbackAnswer, retrieveSources, retrieveSourcesFromDatabase } from "@/lib/rag/retriever"

type ChatRequest = {
  message?: string
  history?: ChatHistoryMessage[]
}

type OpenRouterResponse = {
  choices?: {
    message?: {
      content?: string
    }
  }[]
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

async function generateWithOpenRouter(prompt: string) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return null

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-OpenRouter-Title": "Nihongo AI Study",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini",
      temperature: 0.25,
      messages: [
        {
          role: "system",
          content: nihongoTutorSystemPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenRouter request failed: ${response.status}`)
  }

  const data = (await response.json()) as OpenRouterResponse
  return data.choices?.[0]?.message?.content?.trim() || null
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

  let answer: string | null = null
  let provider: "openrouter" | "fallback" = "fallback"

  try {
    answer = await generateWithOpenRouter(prompt)
    provider = answer ? "openrouter" : "fallback"
  } catch {
    answer = null
  }

  if (!answer) {
    answer = buildFallbackAnswer(message, sources)
  }

  const responseSources = sources.map((source) => ({
    id: source.id,
    type: source.type,
    title: source.title,
    score: source.score,
  }))

  await prisma.chatLog.create({
    data: {
      userId: user.id,
      message,
      answer,
      provider,
      sourcesJson: responseSources,
    },
  })

  return NextResponse.json({
    answer,
    provider,
    sources: responseSources,
  })
}
