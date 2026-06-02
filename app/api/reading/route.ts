import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"
export const revalidate = 0

type QuestionItem = {
  question: string
  options: Array<{
    key: string
    text: string
  }>
  rawText: string
}

type LevelStat = {
  level: string
  percentage: number
}

type ParsedOption = {
  key: string
  text: string
  index: number
  nextIndex: number
}

type HighlightItem = {
  text: string
  level: string | null
  type: string | null
}

type ArticleBlock = {
  text: string
  tokens: Array<{
    text: string
    reading: string | null
  }>
}

function rawTextFromPayload(rawPayload: unknown) {
  if (!rawPayload || typeof rawPayload !== "object") return ""
  const value = (rawPayload as { rawText?: unknown }).rawText
  return typeof value === "string" ? value : ""
}

function rawHtmlFromPayload(rawPayload: unknown) {
  if (!rawPayload || typeof rawPayload !== "object") return ""
  const value = (rawPayload as { rawHtml?: unknown }).rawHtml
  return typeof value === "string" ? value : ""
}

function audioUrlFromPayload(rawPayload: unknown) {
  if (!rawPayload || typeof rawPayload !== "object") return null

  const value = (rawPayload as { audioUrl?: unknown }).audioUrl
  if (typeof value === "string" && value.trim()) return value

  const rawHtml = rawHtmlFromPayload(rawPayload)
  const match = rawHtml.match(/https?:\/\/[^"'\s<>]+\.mp3(?:\?[^"'\s<>]*)?/i)

  return match?.[0] ?? null
}

function categoryFromPayload(rawPayload: unknown) {
  if (!rawPayload || typeof rawPayload !== "object") return null
  const value = (rawPayload as { category?: unknown }).category
  return typeof value === "string" && value.trim() ? value : null
}

function highlightsFromPayload(rawPayload: unknown): HighlightItem[] {
  if (!rawPayload || typeof rawPayload !== "object") return []
  const value = (rawPayload as { highlights?: unknown }).highlights
  if (!Array.isArray(value)) return []

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null
      const text = (item as { text?: unknown }).text
      const level = (item as { level?: unknown }).level
      const type = (item as { type?: unknown }).type

      if (typeof text !== "string" || !text.trim()) return null

      return {
        text: text.trim(),
        level: typeof level === "string" && level.trim() ? level.trim().toUpperCase() : null,
        type: typeof type === "string" && type.trim() ? type.trim() : null,
      }
    })
    .filter((item): item is HighlightItem => item !== null)
}

function articleBlocksFromPayload(rawPayload: unknown): ArticleBlock[] {
  if (!rawPayload || typeof rawPayload !== "object") return []
  const value = (rawPayload as { articleBlocks?: unknown }).articleBlocks
  if (!Array.isArray(value)) return []

  return value
    .map((block) => {
      if (!block || typeof block !== "object") return null
      const text = (block as { text?: unknown }).text
      const tokens = (block as { tokens?: unknown }).tokens
      if (typeof text !== "string" || !Array.isArray(tokens)) return null

      const normalizedTokens = tokens
        .map((token) => {
          if (!token || typeof token !== "object") return null
          const tokenText = (token as { text?: unknown }).text
          const reading = (token as { reading?: unknown }).reading
          if (typeof tokenText !== "string" || !tokenText) return null

          return {
            text: tokenText,
            reading: typeof reading === "string" && reading.trim() ? reading : null,
          }
        })
        .filter((token): token is ArticleBlock["tokens"][number] => token !== null)

      return normalizedTokens.length > 0
        ? {
            text,
            tokens: normalizedTokens,
          }
        : null
    })
    .filter((block): block is ArticleBlock => block !== null)
}

function normalizeLevelStats(value: unknown): LevelStat[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null
      const level = (item as { level?: unknown }).level
      const percentage = (item as { percentage?: unknown }).percentage

      if (typeof level !== "string" || !/^N[1-5]$/.test(level)) return null
      if (typeof percentage !== "number" || Number.isNaN(percentage)) return null

      return {
        level,
        percentage: Math.min(Math.max(percentage, 0), 100),
      }
    })
    .filter((item): item is LevelStat => item !== null)
}

function deriveArticleText(rawText: string, fallback: string) {
  const normalized = rawText.replace(/\s+/g, " ").trim()
  const match = normalized.match(
    new RegExp("D\\u1ecbch song ng\\u1eef\\s+(?:Th\\u00eam b\\u1ea3n d\\u1ecbch\\s+)?(.+?)\\s+Ngu\\u1ed3n:")
  )
  const articleText = match?.[1]?.trim()

  return articleText && articleText.length > fallback.length ? articleText : fallback
}

function cleanQuestionLine(line: string) {
  return line.replace(/\s+/g, " ").trim()
}

function isQuestionNoise(line: string) {
  return /^(Câu hỏi|Nộp bài|Từ vựng|Ngữ pháp|Furigana|\d+\/\d+)$/i.test(line)
}

function optionAt(lines: string[], startIndex: number, key: string): ParsedOption | null {
  const line = lines[startIndex] ?? ""
  const inlineMatch = line.match(new RegExp(`^${key}\\s+(.+)$`))

  if (inlineMatch?.[1]) {
    return {
      key,
      text: inlineMatch[1].trim(),
      index: startIndex,
      nextIndex: startIndex + 1,
    }
  }

  if (line === key && lines[startIndex + 1]) {
    return {
      key,
      text: lines[startIndex + 1],
      index: startIndex,
      nextIndex: startIndex + 2,
    }
  }

  return null
}

function findOption(lines: string[], key: string, fromIndex: number, maxDistance = 8) {
  const endIndex = Math.min(lines.length, fromIndex + maxDistance)

  for (let index = fromIndex; index < endIndex; index += 1) {
    const option = optionAt(lines, index, key)
    if (option) return option
  }

  return null
}

function questionBefore(lines: string[], fromIndex: number, boundaryIndex: number) {
  const candidates = lines
    .slice(boundaryIndex, fromIndex)
    .map(cleanQuestionLine)
    .filter((line) => line && !isQuestionNoise(line))
    .filter((line) => !/^[A-D]($|\s+)/.test(line))

  return candidates.at(-1) ?? ""
}

function parseQuestionGroups(lines: string[]): QuestionItem[] {
  const counterQuestions = parseQuestionGroupsByCounter(lines)
  if (counterQuestions.length > 0) return counterQuestions

  const questions: QuestionItem[] = []
  let boundaryIndex = 0

  for (let index = 0; index < lines.length; index += 1) {
    const optionA = optionAt(lines, index, "A")
    if (!optionA) continue

    const optionB = findOption(lines, "B", optionA.nextIndex)
    const optionC = optionB ? findOption(lines, "C", optionB.nextIndex) : null
    const optionD = optionC ? findOption(lines, "D", optionC.nextIndex) : null

    if (!optionB || !optionC || !optionD) continue

    const question = questionBefore(lines, optionA.index, boundaryIndex)
    if (!question) continue

    const options = [optionA, optionB, optionC, optionD].map((option) => ({
      key: option.key,
      text: option.text,
    }))

    questions.push({
      question,
      options,
      rawText: [question, ...options.flatMap((option) => [option.key, option.text])].join(" "),
    })

    boundaryIndex = optionD.nextIndex
    index = optionD.nextIndex - 1
  }

  return questions
}

function parseQuestionGroupsByCounter(lines: string[]): QuestionItem[] {
  const questions: QuestionItem[] = []
  let boundaryIndex = 0

  for (let index = 0; index < lines.length; index += 1) {
    if (!/^\d+\/\d+$/.test(lines[index] ?? "")) continue

    const optionA = findOption(lines, "A", index + 1, 5)
    const optionB = optionA ? findOption(lines, "B", optionA.nextIndex, 5) : null
    const optionC = optionB ? findOption(lines, "C", optionB.nextIndex, 5) : null
    const optionD = optionC ? findOption(lines, "D", optionC.nextIndex, 5) : null

    if (!optionA || !optionB || !optionC || !optionD) continue

    const candidates = lines
      .slice(boundaryIndex, index)
      .map(cleanQuestionLine)
      .filter((line) => line && !isQuestionNoise(line))
      .filter((line) => !/^[A-D]($|\s+)/.test(line))
    const question = candidates.at(-1) ?? ""
    if (!question) continue

    const options = [optionA, optionB, optionC, optionD].map((option) => ({
      key: option.key,
      text: option.text,
    }))

    questions.push({
      question,
      options,
      rawText: [question, lines[index], ...options.flatMap((option) => [option.key, option.text])].join(" "),
    })

    boundaryIndex = optionD.nextIndex
    index = optionD.nextIndex - 1
  }

  return questions
}

function deriveQuestions(rawText: string, fallback: unknown): unknown {
  const fallbackQuestions = Array.isArray(fallback) ? fallback : []
  const normalized = rawText.replace(/\s+/g, " ").trim()
  const allLines = rawText
    .split(/\n+/)
    .map(cleanQuestionLine)
    .filter(Boolean)
  const sectionStart = allLines.findIndex((line) => line === "Câu hỏi")
  const sectionEnd = allLines.findIndex((line, index) => index > sectionStart && line === "Từ vựng")
  const lines =
    sectionStart >= 0 && sectionEnd > sectionStart
      ? allLines.slice(sectionStart, sectionEnd)
      : allLines
  const groupedQuestions = parseQuestionGroups(lines)

  if (groupedQuestions.length > fallbackQuestions.length) return groupedQuestions
  if (fallbackQuestions.length > 0) return fallbackQuestions

  const sectionMatch = normalized.match(
    new RegExp("C\\u00e2u h\\u1ecfi\\s+N\\u1ed9p b\\u00e0i\\s+(.+?)\\s+T\\u1eeb v\\u1ef1ng")
  )
  if (!sectionMatch) return fallback

  const sectionText = sectionMatch[1].trim()
  const questionMatch = sectionText.match(/(.+?)\s+\d+\/\d+\s+A\s+/)
  const optionMatches = Array.from(sectionText.matchAll(/\s([A-D])\s+(.+?)(?=\s[A-D]\s+|$)/g))
  const question: QuestionItem = {
    question: questionMatch?.[1]?.trim() ?? sectionText,
    options: optionMatches.map((match) => ({
      key: match[1],
      text: match[2].trim(),
    })),
    rawText: sectionText,
  }

  return fallbackQuestions.length > 0 ? fallbackQuestions : [question]
}

export async function GET() {
  const articles = await prisma.newsArticle.findMany({
    orderBy: {
      createdAt: "desc",
    },
  })

  return NextResponse.json(
    {
      items: articles.map((article) => {
      const rawText = rawTextFromPayload(article.rawPayload)

      return {
        id: article.id,
        sourceUrl: article.sourceUrl,
        provider: article.provider,
        title: article.title,
        level: article.level,
        category: article.category ?? categoryFromPayload(article.rawPayload),
        articleText: deriveArticleText(rawText, article.articleText),
        articleBlocks: articleBlocksFromPayload(article.rawPayload),
        imageUrl: article.imageUrl,
        audioUrl: article.audioUrl ?? audioUrlFromPayload(article.rawPayload),
        publishedAt: article.publishedAt?.toISOString() ?? null,
        questions: deriveQuestions(rawText, article.questions),
        highlights: highlightsFromPayload(article.rawPayload),
        levelStats: normalizeLevelStats(article.levelStats),
        vocabulary: article.vocabulary,
        grammar: article.grammar,
        createdAt: article.createdAt.toISOString(),
      }
    }),
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  )
}
