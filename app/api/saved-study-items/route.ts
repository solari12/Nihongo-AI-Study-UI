import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const savedStudyItemSchema = z.object({
  type: z.enum(["vocabulary", "grammar"]),
  sourceType: z.string().trim().min(1),
  sourceId: z.string().trim().min(1),
  itemKey: z.string().trim().min(1),
  title: z.string().trim().min(1),
  reading: z.string().trim().optional(),
  level: z.string().trim().optional(),
  meaning: z.string().trim().optional(),
  note: z.string().trim().optional(),
  example: z.string().trim().optional(),
  rawPayload: z.any(),
})

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

  const items = await prisma.savedStudyItem.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return NextResponse.json({
    items: items.map((item) => ({
      id: item.id,
      type: item.type,
      sourceType: item.sourceType,
      sourceId: item.sourceId,
      itemKey: item.itemKey,
      title: item.title,
      reading: item.reading,
      level: item.level,
      meaning: item.meaning,
      note: item.note,
      example: item.example,
      rawPayload: item.rawPayload,
      createdAt: item.createdAt.toISOString(),
    })),
  })
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

  const parsed = savedStudyItemSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: "Invalid saved item payload" }, { status: 400 })

  const item = parsed.data
  const saved = await prisma.savedStudyItem.upsert({
    where: {
      userId_type_itemKey: {
        userId: user.id,
        type: item.type,
        itemKey: item.itemKey,
      },
    },
    update: {
      sourceType: item.sourceType,
      sourceId: item.sourceId,
      title: item.title,
      reading: item.reading,
      level: item.level,
      meaning: item.meaning,
      note: item.note,
      example: item.example,
      rawPayload: item.rawPayload,
    },
    create: {
      userId: user.id,
      type: item.type,
      sourceType: item.sourceType,
      sourceId: item.sourceId,
      itemKey: item.itemKey,
      title: item.title,
      reading: item.reading,
      level: item.level,
      meaning: item.meaning,
      note: item.note,
      example: item.example,
      rawPayload: item.rawPayload,
    },
  })

  return NextResponse.json({
    item: {
      id: saved.id,
      type: saved.type,
      itemKey: saved.itemKey,
      title: saved.title,
    },
  })
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

  const id = request.nextUrl.searchParams.get("id")?.trim()
  if (!id) return NextResponse.json({ error: "Saved item id is required" }, { status: 400 })

  const result = await prisma.savedStudyItem.deleteMany({
    where: {
      id,
      userId: user.id,
    },
  })

  if (result.count === 0) return NextResponse.json({ error: "Saved item not found" }, { status: 404 })
  return NextResponse.json({ ok: true })
}
