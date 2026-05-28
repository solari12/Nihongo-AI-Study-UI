import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAdminUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { buildVocabularyChunk, toVocabularyItem } from "@/lib/mappers/study-content"

const vocabularySchema = z.object({
  id: z.number().int().positive().optional(),
  japanese: z.string().trim().min(1),
  hiragana: z.string().trim().min(1),
  romaji: z.string().trim().min(1),
  vietnamese: z.string().trim().min(1),
  type: z.string().trim().min(1),
  topic: z.string().trim().min(1),
  example: z.object({
    japanese: z.string().trim().min(1),
    vietnamese: z.string().trim().min(1),
  }),
})

export async function GET() {
  const vocabulary = await prisma.vocabulary.findMany({
    orderBy: {
      id: "asc",
    },
  })
  const items = vocabulary.map(toVocabularyItem)
  const topics = ["Tất cả", ...Array.from(new Set(items.map((item) => item.topic)))]

  return NextResponse.json({
    topics,
    items,
  })
}

export async function POST(request: NextRequest) {
  const admin = await requireAdminUser()
  if (!admin) return NextResponse.json({ error: "Admin access required" }, { status: 403 })

  const parsed = vocabularySchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: "Invalid vocabulary payload" }, { status: 400 })

  const item = parsed.data
  const created = await prisma.$transaction(async (tx) => {
    const maxId = await tx.vocabulary.aggregate({ _max: { id: true } })
    const id = (maxId._max.id ?? 0) + 1
    const vocabulary = await tx.vocabulary.create({
      data: {
        id,
        japanese: item.japanese,
        hiragana: item.hiragana,
        romaji: item.romaji,
        vietnamese: item.vietnamese,
        type: item.type,
        topic: item.topic,
        exampleJapanese: item.example.japanese,
        exampleVietnamese: item.example.vietnamese,
      },
    })

    await tx.knowledgeChunk.create({
      data: {
        id: `vocabulary-${id}`,
        sourceType: "vocabulary",
        sourceId: String(id),
        title: `${item.japanese} / ${item.romaji}`,
        content: buildVocabularyChunk(item),
        vocabularyId: id,
      },
    })

    return vocabulary
  })

  return NextResponse.json({ item: toVocabularyItem(created) }, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const admin = await requireAdminUser()
  if (!admin) return NextResponse.json({ error: "Admin access required" }, { status: 403 })

  const parsed = vocabularySchema.required({ id: true }).safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: "Invalid vocabulary payload" }, { status: 400 })

  const item = parsed.data
  const updated = await prisma.$transaction(async (tx) => {
    const vocabulary = await tx.vocabulary.update({
      where: { id: item.id },
      data: {
        japanese: item.japanese,
        hiragana: item.hiragana,
        romaji: item.romaji,
        vietnamese: item.vietnamese,
        type: item.type,
        topic: item.topic,
        exampleJapanese: item.example.japanese,
        exampleVietnamese: item.example.vietnamese,
      },
    })

    await tx.knowledgeChunk.upsert({
      where: { id: `vocabulary-${item.id}` },
      update: {
        title: `${item.japanese} / ${item.romaji}`,
        content: buildVocabularyChunk(item),
        vocabularyId: item.id,
      },
      create: {
        id: `vocabulary-${item.id}`,
        sourceType: "vocabulary",
        sourceId: String(item.id),
        title: `${item.japanese} / ${item.romaji}`,
        content: buildVocabularyChunk(item),
        vocabularyId: item.id,
      },
    })

    return vocabulary
  })

  return NextResponse.json({ item: toVocabularyItem(updated) })
}

export async function DELETE(request: NextRequest) {
  const admin = await requireAdminUser()
  if (!admin) return NextResponse.json({ error: "Admin access required" }, { status: 403 })

  const parsed = z.object({ id: z.number().int().positive() }).safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: "Invalid vocabulary id" }, { status: 400 })

  await prisma.vocabulary.delete({ where: { id: parsed.data.id } })
  return NextResponse.json({ ok: true })
}
