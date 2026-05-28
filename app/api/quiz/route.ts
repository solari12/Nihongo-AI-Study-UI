import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAdminUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { buildQuizChunk, toDbDifficulty, toQuizQuestionItem } from "@/lib/mappers/study-content"

const quizSchema = z.object({
  id: z.number().int().positive().optional(),
  question: z.string().trim().min(1),
  type: z.enum(["vocabulary", "grammar"]),
  difficulty: z.string().trim().min(1),
  topic: z.string().trim().min(1),
  correctAnswer: z.string().trim().min(1),
  explanation: z.string().trim().min(1),
  answers: z.array(
    z.object({
      id: z.string().trim().min(1),
      text: z.string().trim().min(1),
    })
  ).min(2),
})

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

export async function POST(request: NextRequest) {
  const admin = await requireAdminUser()
  if (!admin) return NextResponse.json({ error: "Admin access required" }, { status: 403 })

  const parsed = quizSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: "Invalid quiz payload" }, { status: 400 })

  const item = parsed.data
  const created = await prisma.$transaction(async (tx) => {
    const maxId = await tx.quizQuestion.aggregate({ _max: { id: true } })
    const id = (maxId._max.id ?? 0) + 1
    const quiz = await tx.quizQuestion.create({
      data: {
        id,
        question: item.question,
        type: item.type,
        difficulty: toDbDifficulty(item.difficulty),
        topic: item.topic,
        correctAnswer: item.correctAnswer,
        explanation: item.explanation,
        answers: {
          create: item.answers.map((answer) => ({
            answerKey: answer.id,
            answerText: answer.text,
          })),
        },
      },
      include: {
        answers: true,
      },
    })

    await tx.knowledgeChunk.create({
      data: {
        id: `quiz-${id}`,
        sourceType: "quiz",
        sourceId: String(id),
        title: item.question,
        content: buildQuizChunk(item),
        quizId: id,
      },
    })

    return quiz
  })

  return NextResponse.json({ item: toQuizQuestionItem(created) }, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const admin = await requireAdminUser()
  if (!admin) return NextResponse.json({ error: "Admin access required" }, { status: 403 })

  const parsed = quizSchema.required({ id: true }).safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: "Invalid quiz payload" }, { status: 400 })

  const item = parsed.data
  const updated = await prisma.$transaction(async (tx) => {
    await tx.quizAnswer.deleteMany({
      where: {
        questionId: item.id,
      },
    })

    const quiz = await tx.quizQuestion.update({
      where: { id: item.id },
      data: {
        question: item.question,
        type: item.type,
        difficulty: toDbDifficulty(item.difficulty),
        topic: item.topic,
        correctAnswer: item.correctAnswer,
        explanation: item.explanation,
        answers: {
          create: item.answers.map((answer) => ({
            answerKey: answer.id,
            answerText: answer.text,
          })),
        },
      },
      include: {
        answers: true,
      },
    })

    await tx.knowledgeChunk.upsert({
      where: { id: `quiz-${item.id}` },
      update: {
        title: item.question,
        content: buildQuizChunk(item),
        quizId: item.id,
      },
      create: {
        id: `quiz-${item.id}`,
        sourceType: "quiz",
        sourceId: String(item.id),
        title: item.question,
        content: buildQuizChunk(item),
        quizId: item.id,
      },
    })

    return quiz
  })

  return NextResponse.json({ item: toQuizQuestionItem(updated) })
}

export async function DELETE(request: NextRequest) {
  const admin = await requireAdminUser()
  if (!admin) return NextResponse.json({ error: "Admin access required" }, { status: 403 })

  const parsed = z.object({ id: z.number().int().positive() }).safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: "Invalid quiz id" }, { status: 400 })

  await prisma.quizQuestion.delete({ where: { id: parsed.data.id } })
  return NextResponse.json({ ok: true })
}
