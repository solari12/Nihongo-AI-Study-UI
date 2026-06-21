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

  const now = new Date()
  const [vocabularyProgress, quizAttempts, vocabularyTotal] = await Promise.all([
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
    prisma.vocabulary.count(),
  ])

  const dueVocabulary = vocabularyProgress.filter((item) => item.dueAt <= now)
  const masteredVocabulary = vocabularyProgress.filter((item) => item.stage === "mastered")
  const learningVocabulary = vocabularyProgress.filter((item) => item.stage === "learning")

  return NextResponse.json({
    learnedVocabularyIds: vocabularyProgress.map((item) => item.vocabularyId),
    reviewVocabularyIds: dueVocabulary.map((item) => item.vocabularyId),
    vocabulary: {
      total: vocabularyTotal,
      studied: vocabularyProgress.length,
      mastered: masteredVocabulary.length,
      dueReview: dueVocabulary.length,
      learning: learningVocabulary.length,
    },
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
    const isLearned = parsed.data.status === "learned"
    const progress = await prisma.userVocabularyProgress.upsert({
      where: {
        userId_vocabularyId: {
          userId: user.id,
          vocabularyId: parsed.data.vocabularyId,
        },
      },
      update: {
        stage: isLearned ? "review" : "learning",
        repetitions: isLearned ? 1 : 0,
        intervalDays: 1,
        lastQuality: isLearned ? 5 : 1,
        lapses: isLearned ? undefined : { increment: 1 },
        lastReviewedAt: now,
        dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      create: {
        userId: user.id,
        vocabularyId: parsed.data.vocabularyId,
        stage: isLearned ? "review" : "learning",
        repetitions: isLearned ? 1 : 0,
        intervalDays: 1,
        lastQuality: isLearned ? 5 : 1,
        lapses: isLearned ? 0 : 1,
        lastReviewedAt: now,
        dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
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
