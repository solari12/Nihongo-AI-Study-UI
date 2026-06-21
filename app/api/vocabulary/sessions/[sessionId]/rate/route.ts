import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculateSm2 } from "@/lib/vocabulary/sm2"
import { getVocabularySessionForUser } from "@/lib/vocabulary/session-service"

const rateSchema = z.object({
  vocabularyId: z.number().int().positive(),
  rating: z.enum(["forgot", "hard", "remembered"]),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

  const parsed = rateSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: "Invalid vocabulary rating" }, { status: 400 })

  const { sessionId } = await params
  const { vocabularyId, rating } = parsed.data
  const reviewedAt = new Date()

  const result = await prisma.$transaction(async (tx) => {
    const session = await tx.vocabularyStudySession.findFirst({
      where: { id: sessionId, userId: user.id },
      include: {
        items: {
          orderBy: { position: "asc" },
          select: {
            vocabularyId: true,
            position: true,
            rating: true,
          },
        },
      },
    })

    if (!session) return { kind: "not_found" as const }

    const requestedItem = session.items.find((item) => item.vocabularyId === vocabularyId)
    if (!requestedItem) return { kind: "invalid_item" as const }

    if (requestedItem.rating) {
      return { kind: "idempotent" as const }
    }

    if (session.status !== "active") {
      return { kind: "completed" as const }
    }

    const currentItem = session.items.find((item) => item.position === session.currentPosition)
    if (!currentItem || currentItem.vocabularyId !== vocabularyId) {
      return { kind: "out_of_order" as const }
    }

    const claimed = await tx.vocabularyStudySessionItem.updateMany({
      where: {
        sessionId,
        vocabularyId,
        rating: null,
      },
      data: {
        rating,
        answeredAt: reviewedAt,
      },
    })

    if (claimed.count === 0) return { kind: "idempotent" as const }

    const currentProgress = await tx.userVocabularyProgress.findUnique({
      where: {
        userId_vocabularyId: {
          userId: user.id,
          vocabularyId,
        },
      },
      select: {
        repetitions: true,
        intervalDays: true,
        easeFactor: true,
        lapses: true,
      },
    })
    const nextProgress = calculateSm2(currentProgress, rating, reviewedAt)

    await tx.userVocabularyProgress.upsert({
      where: {
        userId_vocabularyId: {
          userId: user.id,
          vocabularyId,
        },
      },
      update: {
        stage: nextProgress.stage,
        repetitions: nextProgress.repetitions,
        intervalDays: nextProgress.intervalDays,
        easeFactor: nextProgress.easeFactor,
        lastQuality: nextProgress.quality,
        lapses: nextProgress.lapses,
        lastReviewedAt: reviewedAt,
        dueAt: nextProgress.dueAt,
      },
      create: {
        userId: user.id,
        vocabularyId,
        stage: nextProgress.stage,
        repetitions: nextProgress.repetitions,
        intervalDays: nextProgress.intervalDays,
        easeFactor: nextProgress.easeFactor,
        lastQuality: nextProgress.quality,
        lapses: nextProgress.lapses,
        lastReviewedAt: reviewedAt,
        dueAt: nextProgress.dueAt,
      },
    })

    const nextPosition = session.currentPosition + 1
    const isComplete = nextPosition >= session.totalItems

    const updatedSession = await tx.vocabularyStudySession.updateMany({
      where: {
        id: sessionId,
        userId: user.id,
        status: "active",
        currentPosition: session.currentPosition,
      },
      data: {
        currentPosition: nextPosition,
        status: isComplete ? "completed" : "active",
        completedAt: isComplete ? reviewedAt : null,
      },
    })

    if (isComplete && updatedSession.count === 1) {
      const ratedItems = await tx.vocabularyStudySessionItem.findMany({
        where: { sessionId },
        select: { rating: true },
      })
      const rememberedCount = ratedItems.filter((item) => item.rating === "remembered").length
      await tx.activityLog.create({
        data: {
          userId: user.id,
          type: "vocabulary_session",
          content: `Hoàn thành phiên từ vựng: ${rememberedCount}/${session.totalItems} từ nhớ tốt`,
          topic: session.topicKey ?? "N5",
          result: "completed",
          score: rememberedCount,
          durationMinutes: Math.max(3, Math.ceil(session.totalItems * 0.75)),
        },
      })
    }

    return {
      kind: "rated" as const,
      progress: {
        stage: nextProgress.stage,
        repetitions: nextProgress.repetitions,
        intervalDays: nextProgress.intervalDays,
        easeFactor: nextProgress.easeFactor,
        dueAt: nextProgress.dueAt.toISOString(),
      },
    }
  })

  if (result.kind === "not_found") {
    return NextResponse.json({ error: "Vocabulary session not found" }, { status: 404 })
  }
  if (result.kind === "invalid_item") {
    return NextResponse.json({ error: "Vocabulary is not part of this session" }, { status: 400 })
  }
  if (result.kind === "out_of_order") {
    return NextResponse.json({ error: "This is not the current vocabulary card" }, { status: 409 })
  }

  // Reconcile the cursor from the immutable session items. This also makes a
  // repeated request idempotent if the first response was lost after commit.
  const nextUnanswered = await prisma.vocabularyStudySessionItem.findFirst({
    where: {
      sessionId,
      rating: null,
    },
    orderBy: { position: "asc" },
    select: { position: true },
  })
  await prisma.vocabularyStudySession.update({
    where: { id: sessionId },
    data: nextUnanswered
      ? {
          currentPosition: nextUnanswered.position,
          status: "active",
          completedAt: null,
        }
      : {
          currentPosition: (await prisma.vocabularyStudySessionItem.count({ where: { sessionId } })),
          status: "completed",
          completedAt: reviewedAt,
        },
  })

  const session = await getVocabularySessionForUser(sessionId, user.id)
  if (!session) return NextResponse.json({ error: "Vocabulary session not found" }, { status: 404 })

  return NextResponse.json({
    session,
    progress: result.kind === "rated" ? result.progress : undefined,
    idempotent: result.kind === "idempotent" || result.kind === "completed",
  })
}
