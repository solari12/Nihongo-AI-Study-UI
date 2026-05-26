import { NextRequest, NextResponse } from "next/server"
import { buildChatPrompt, nihongoTutorSystemPrompt } from "@/lib/rag/chat-prompt"
import { buildFallbackAnswer, retrieveSources } from "@/lib/rag/retriever"
import type { AdminContent } from "@/hooks/use-admin-content"

type ChatRequest = {
  message?: string
  content?: Partial<AdminContent>
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

  const sources = retrieveSources(message, 5, body.content)
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
