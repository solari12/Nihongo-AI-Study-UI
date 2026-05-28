import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { buildChatPrompt, nihongoTutorSystemPrompt } from "@/lib/rag/chat-prompt"
import { buildFallbackAnswer, retrieveSources, retrieveSourcesFromDatabase } from "@/lib/rag/retriever"

type ChatRequest = {
  message?: string
}

type OpenRouterResponse = {
  choices?: {
    message?: {
      content?: string
    }
  }[]
}

async function generateWithOpenRouter(message: string, prompt: string) {
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
      temperature: 0.3,
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
  const body = (await request.json()) as ChatRequest
  const message = body.message?.trim()

  if (!message) {
    return NextResponse.json(
      {
        error: "Message is required",
      },
      { status: 400 }
    )
  }

  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

  let sources = await retrieveSourcesFromDatabase(message, 5)

  if (!sources.length) {
    sources = retrieveSources(message, 5)
  }

  const prompt = buildChatPrompt(message, sources)

  let answer: string | null = null
  let provider: "openrouter" | "fallback" = "fallback"

  try {
    answer = await generateWithOpenRouter(message, prompt)
    provider = answer ? "openrouter" : "fallback"
  } catch {
    answer = null
  }

  if (!answer) {
    answer = buildFallbackAnswer(message, sources)
  }

  await prisma.chatLog.create({
    data: {
      userId: user.id,
      message,
      answer,
      provider,
      sourcesJson: sources.map((source) => ({
        id: source.id,
        type: source.type,
        title: source.title,
        score: source.score,
      })),
    },
  })

  return NextResponse.json({
    answer,
    provider,
    sources: sources.map((source) => ({
      id: source.id,
      type: source.type,
      title: source.title,
      score: source.score,
    })),
  })
}
