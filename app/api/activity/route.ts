import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const activitySchema = z.object({
  type: z.string().trim().min(1),
  content: z.string().trim().min(1),
  topic: z.string().trim().optional(),
  result: z.string().trim().optional(),
  score: z.number().int().optional(),
  durationMinutes: z.number().int().positive().optional(),
})

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

  const activities = await prisma.activityLog.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return NextResponse.json({
    items: activities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      content: activity.content,
      topic: activity.topic ?? undefined,
      result: activity.result ?? undefined,
      score: activity.score ?? undefined,
      durationMinutes: activity.durationMinutes ?? undefined,
      createdAt: activity.createdAt.toISOString(),
    })),
  })
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

  const parsed = activitySchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: "Invalid activity payload" }, { status: 400 })

  const activity = await prisma.activityLog.create({
    data: {
      userId: user.id,
      type: parsed.data.type,
      content: parsed.data.content,
      topic: parsed.data.topic,
      result: parsed.data.result,
      score: parsed.data.score,
      durationMinutes: parsed.data.durationMinutes,
    },
  })

  return NextResponse.json(
    {
      item: {
        id: activity.id,
        type: activity.type,
        content: activity.content,
        topic: activity.topic ?? undefined,
        result: activity.result ?? undefined,
        score: activity.score ?? undefined,
        durationMinutes: activity.durationMinutes ?? undefined,
        createdAt: activity.createdAt.toISOString(),
      },
    },
    { status: 201 }
  )
}

export async function DELETE() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

  await prisma.activityLog.deleteMany({
    where: {
      userId: user.id,
    },
  })

  return NextResponse.json({ ok: true })
}
