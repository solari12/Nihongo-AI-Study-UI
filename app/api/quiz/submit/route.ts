import { NextRequest, NextResponse } from "next/server"
import { quizQuestions } from "@/lib/data/nihongo-study"

type SubmitQuizBody = {
  quizType?: string
  questionIds?: number[]
  answers?: Record<string, string>
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as SubmitQuizBody
  const answerMap = body.answers ?? {}
  const questionIds = new Set(body.questionIds ?? [])
  const questions = questionIds.size
    ? quizQuestions.filter((question) => questionIds.has(question.id))
    : quizQuestions

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
