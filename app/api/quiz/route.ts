import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { toQuizQuestionItem } from "@/lib/mappers/study-content"

export async function GET() {
  const quizQuestions = await prisma.quizQuestion.findMany({
    include: {
      answers: true,
    },
    orderBy: {
      id: "asc",
    },
  })

  return NextResponse.json({
    items: quizQuestions.map(toQuizQuestionItem),
  })
}
