import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const vocabularyProgressSchema = z.object({
  type: z.literal("vocabulary"),
  vocabularyId: z.number().int().positive(),
  status: z.enum(["learned", "review"]),
})

const quizAttemptSchema = z.object({
  type: z.literal("quiz_attempt"),
  quizType: z.string().trim().min(1),
  score: z.number().int().min(0),
  total: z.number().int().positive(),
  percentage: z.number().int().min(0).max(100),
})

const progressMutationSchema = z.discriminatedUnion("type", [
  vocabularyProgressSchema,
  quizAttemptSchema,
])

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

  const [vocabularyProgress, quizAttempts] = await Promise.all([
    prisma.userVocabularyProgress.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),
    prisma.quizAttempt.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    }),
  ])

  return NextResponse.json({
    learnedVocabularyIds: vocabularyProgress
      .filter((item) => item.status === "learned")
      .map((item) => item.vocabularyId),
    reviewVocabularyIds: vocabularyProgress
      .filter((item) => item.status === "review")
      .map((item) => item.vocabularyId),
    quizAttempts: quizAttempts.map((attempt) => ({
      id: attempt.id,
      date: attempt.createdAt.toISOString(),
      quizType: attempt.quizType,
      score: attempt.score,
      total: attempt.total,
      percentage: attempt.percentage,
    })),
  })
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

  const parsed = progressMutationSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: "Invalid progress payload" }, { status: 400 })

  if (parsed.data.type === "vocabulary") {
    const now = new Date()
    const progress = await prisma.userVocabularyProgress.upsert({
      where: {
        userId_vocabularyId: {
          userId: user.id,
          vocabularyId: parsed.data.vocabularyId,
        },
      },
      update: {
        status: parsed.data.status,
        lastReviewedAt: now,
        nextReviewAt: parsed.data.status === "review" ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null,
      },
      create: {
        userId: user.id,
        vocabularyId: parsed.data.vocabularyId,
        status: parsed.data.status,
        lastReviewedAt: now,
        nextReviewAt: parsed.data.status === "review" ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null,
      },
    })

    return NextResponse.json({ item: progress })
  }

  const attempt = await prisma.quizAttempt.create({
    data: {
      userId: user.id,
      quizType: parsed.data.quizType === "mixed" ? "vocabulary" : parsed.data.quizType === "grammar" ? "grammar" : "vocabulary",
      score: parsed.data.score,
      total: parsed.data.total,
      percentage: parsed.data.percentage,
    },
  })

  return NextResponse.json({
    item: {
      id: attempt.id,
      date: attempt.createdAt.toISOString(),
      quizType: parsed.data.quizType,
      score: attempt.score,
      total: attempt.total,
      percentage: attempt.percentage,
    },
  })
}
