import { createHash } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/lib/generated/prisma/client"

const todaiiImportSchema = z.object({
  sourceUrl: z.string().url(),
  provider: z.string().trim().min(1).default("TODAII"),
  title: z.string().trim().min(1),
  level: z.string().trim().min(1).default("unknown"),
  category: z.string().trim().min(1).optional().nullable(),
  articleText: z.string().trim().min(1),
  articleBlocks: z
    .array(
      z.object({
        text: z.string(),
        tokens: z.array(
          z.object({
            text: z.string(),
            reading: z.string().optional().nullable(),
          })
        ),
      })
    )
    .default([]),
  imageUrl: z.string().url().optional().nullable(),
  audioUrl: z.string().url().optional().nullable(),
  publishedAt: z.string().datetime().optional().nullable(),
  questions: z.array(z.unknown()).default([]),
  highlights: z
    .array(
      z.object({
        text: z.string().trim().min(1),
        level: z.string().trim().optional().nullable(),
        type: z.string().trim().optional().nullable(),
      })
    )
    .default([]),
  levelStats: z
    .array(
      z.object({
        level: z.string().regex(/^N[1-5]$/),
        percentage: z.number().min(0).max(100),
      })
    )
    .default([]),
  vocabulary: z.array(z.unknown()).default([]),
  grammar: z.array(z.unknown()).default([]),
  rawText: z.string().optional(),
  rawHtml: z.string().optional(),
})

function knowledgeChunkIdFor(sourceUrl: string) {
  const hash = createHash("sha1").update(sourceUrl).digest("hex").slice(0, 16)
  return `todaii-news-${hash}`
}

function buildKnowledgeContent(payload: z.infer<typeof todaiiImportSchema>) {
  return [
    `Bai doc TODAII: ${payload.title}`,
    `JLPT level: ${payload.level}.`,
    `Chu de: ${payload.category ?? ""}`,
    `Noi dung tieng Nhat: ${payload.articleText}`,
    `Furigana blocks: ${JSON.stringify(payload.articleBlocks)}`,
    `Audio: ${payload.audioUrl ?? ""}`,
    `Thong ke cap do: ${JSON.stringify(payload.levelStats)}`,
    `Highlight: ${JSON.stringify(payload.highlights)}`,
    `Tu vung: ${JSON.stringify(payload.vocabulary)}`,
    `Ngu phap: ${JSON.stringify(payload.grammar)}`,
    `Cau hoi: ${JSON.stringify(payload.questions)}`,
    `Nguon: ${payload.sourceUrl}`,
  ].join("\n")
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}

export async function POST(request: NextRequest) {
  const expectedToken = process.env.TODAII_IMPORT_TOKEN
  const token = request.headers.get("x-import-token")

  if (!expectedToken || token !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = todaiiImportSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid payload",
        issues: parsed.error.flatten(),
      },
      { status: 400 }
    )
  }

  const payload = parsed.data
  const publishedAt = payload.publishedAt ? new Date(payload.publishedAt) : null
  const rawPayload = payload

  const article = await prisma.$transaction(async (tx) => {
    const savedArticle = await tx.newsArticle.upsert({
      where: {
        sourceUrl: payload.sourceUrl,
      },
      update: {
        provider: payload.provider,
        title: payload.title,
        level: payload.level,
        category: payload.category ?? null,
        articleText: payload.articleText,
        imageUrl: payload.imageUrl ?? null,
        audioUrl: payload.audioUrl ?? null,
        publishedAt,
        questions: toJsonValue(payload.questions),
        levelStats: toJsonValue(payload.levelStats),
        vocabulary: toJsonValue(payload.vocabulary),
        grammar: toJsonValue(payload.grammar),
        rawPayload: toJsonValue(rawPayload),
      },
      create: {
        sourceUrl: payload.sourceUrl,
        provider: payload.provider,
        title: payload.title,
        level: payload.level,
        category: payload.category ?? null,
        articleText: payload.articleText,
        imageUrl: payload.imageUrl ?? null,
        audioUrl: payload.audioUrl ?? null,
        publishedAt,
        questions: toJsonValue(payload.questions),
        levelStats: toJsonValue(payload.levelStats),
        vocabulary: toJsonValue(payload.vocabulary),
        grammar: toJsonValue(payload.grammar),
        rawPayload: toJsonValue(rawPayload),
      },
    })

    await tx.knowledgeChunk.upsert({
      where: {
        id: knowledgeChunkIdFor(payload.sourceUrl),
      },
      update: {
        sourceType: "todaii-news",
        sourceId: payload.sourceUrl,
        title: payload.title,
        content: buildKnowledgeContent(payload),
      },
      create: {
        id: knowledgeChunkIdFor(payload.sourceUrl),
        sourceType: "todaii-news",
        sourceId: payload.sourceUrl,
        title: payload.title,
        content: buildKnowledgeContent(payload),
      },
    })

    return savedArticle
  })

  return NextResponse.json({
    ok: true,
    articleId: article.id,
  })
}
