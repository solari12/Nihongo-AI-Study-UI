import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAdminUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { buildGrammarChunk, toDbDifficulty, toDbGrammarStatus, toGrammarItem } from "@/lib/mappers/study-content"

const grammarSchema = z.object({
  id: z.number().int().positive().optional(),
  pattern: z.string().trim().min(1),
  meaning: z.string().trim().min(1),
  structure: z.string().trim().min(1),
  usageNote: z.string().trim().min(1),
  difficulty: z.string().trim().min(1),
  status: z.string().trim().min(1).optional(),
  example: z.object({
    japanese: z.string().trim().min(1),
    vietnamese: z.string().trim().min(1),
  }),
})

export async function GET() {
  const grammar = await prisma.grammar.findMany({
    orderBy: {
      id: "asc",
    },
  })

  return NextResponse.json({
    filters: ["Tất cả", "Chưa học", "Đang học", "Đã hoàn thành"],
    items: grammar.map(toGrammarItem),
  })
}

export async function POST(request: NextRequest) {
  const admin = await requireAdminUser()
  if (!admin) return NextResponse.json({ error: "Admin access required" }, { status: 403 })

  const parsed = grammarSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: "Invalid grammar payload" }, { status: 400 })

  const item = parsed.data
  const created = await prisma.$transaction(async (tx) => {
    const maxId = await tx.grammar.aggregate({ _max: { id: true } })
    const id = (maxId._max.id ?? 0) + 1
    const grammar = await tx.grammar.create({
      data: {
        id,
        pattern: item.pattern,
        meaning: item.meaning,
        structure: item.structure,
        usageNote: item.usageNote,
        exampleJapanese: item.example.japanese,
        exampleVietnamese: item.example.vietnamese,
        difficulty: toDbDifficulty(item.difficulty),
        status: toDbGrammarStatus(item.status ?? ""),
      },
    })

    await tx.knowledgeChunk.create({
      data: {
        id: `grammar-${id}`,
        sourceType: "grammar",
        sourceId: String(id),
        title: item.pattern,
        content: buildGrammarChunk(item),
        grammarId: id,
      },
    })

    return grammar
  })

  return NextResponse.json({ item: toGrammarItem(created) }, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const admin = await requireAdminUser()
  if (!admin) return NextResponse.json({ error: "Admin access required" }, { status: 403 })

  const parsed = grammarSchema.required({ id: true }).safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: "Invalid grammar payload" }, { status: 400 })

  const item = parsed.data
  const updated = await prisma.$transaction(async (tx) => {
    const grammar = await tx.grammar.update({
      where: { id: item.id },
      data: {
        pattern: item.pattern,
        meaning: item.meaning,
        structure: item.structure,
        usageNote: item.usageNote,
        exampleJapanese: item.example.japanese,
        exampleVietnamese: item.example.vietnamese,
        difficulty: toDbDifficulty(item.difficulty),
        status: toDbGrammarStatus(item.status ?? ""),
      },
    })

    await tx.knowledgeChunk.upsert({
      where: { id: `grammar-${item.id}` },
      update: {
        title: item.pattern,
        content: buildGrammarChunk(item),
        grammarId: item.id,
      },
      create: {
        id: `grammar-${item.id}`,
        sourceType: "grammar",
        sourceId: String(item.id),
        title: item.pattern,
        content: buildGrammarChunk(item),
        grammarId: item.id,
      },
    })

    return grammar
  })

  return NextResponse.json({ item: toGrammarItem(updated) })
}

export async function DELETE(request: NextRequest) {
  const admin = await requireAdminUser()
  if (!admin) return NextResponse.json({ error: "Admin access required" }, { status: 403 })

  const parsed = z.object({ id: z.number().int().positive() }).safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: "Invalid grammar id" }, { status: 400 })

  await prisma.grammar.delete({ where: { id: parsed.data.id } })
  return NextResponse.json({ ok: true })
}
