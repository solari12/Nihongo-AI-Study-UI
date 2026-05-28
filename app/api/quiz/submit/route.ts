import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type SubmitQuizBody = {
  quizType?: string
  questionIds?: number[]
  answers?: Record<string, string>
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

  const body = (await request.json()) as SubmitQuizBody
  const answerMap = body.answers ?? {}
  const questionIds = body.questionIds ?? []
  const questions = await prisma.quizQuestion.findMany({
    where: questionIds.length
      ? {
          id: {
            in: questionIds,
          },
        }
      : undefined,
    orderBy: {
      id: "asc",
    },
  })

  const details = questions.map((question) => {
    const selectedAnswer = answerMap[String(question.id)]
    return {
      questionId: question.id,
      selectedAnswer,
      correctAnswer: question.correctAnswer,
      isCorrect: selectedAnswer === question.correctAnswer,
      explanation: question.explanation,
    }
  })

  const score = details.filter((detail) => detail.isCorrect).length
  const total = questions.length
  const percentage = total ? Math.round((score / total) * 100) : 0

  return NextResponse.json({
    quizType: body.quizType ?? "mixed",
    score,
    total,
    percentage,
    details,
  })
}
