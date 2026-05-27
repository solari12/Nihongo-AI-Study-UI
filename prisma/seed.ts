import { config } from "dotenv"
import { randomBytes, scryptSync } from "node:crypto"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../lib/generated/prisma/client"
import {
  grammarData,
  quizQuestions,
  vocabularyData,
  type GrammarItem,
} from "../lib/data/nihongo-study"

config({ path: ".env.local" })

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured")
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
})

function hashSeedPassword(password: string) {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(password, salt, 64).toString("hex")
  return `scrypt:${salt}:${hash}`
}

function mapGrammarStatus(item: GrammarItem) {
  if ([1, 3, 7].includes(item.id)) return "completed" as const
  if ([2, 4].includes(item.id)) return "in_progress" as const
  return "not_started" as const
}

function mapGrammarDifficulty(item: GrammarItem) {
  if ([1, 2, 3, 7].includes(item.id)) return "easy" as const
  if (item.id === 8) return "medium" as const
  return "medium" as const
}

async function main() {
  await prisma.user.upsert({
    where: { email: "learner@example.com" },
    update: {
      passwordHash: hashSeedPassword("password123"),
    },
    create: {
      id: "demo-learner",
      fullName: "Demo Learner",
      email: "learner@example.com",
      passwordHash: hashSeedPassword("password123"),
      role: "learner",
    },
  })

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {
      passwordHash: hashSeedPassword("password123"),
    },
    create: {
      id: "demo-admin",
      fullName: "Demo Admin",
      email: "admin@example.com",
      passwordHash: hashSeedPassword("password123"),
      role: "admin",
    },
  })

  for (const item of vocabularyData) {
    await prisma.vocabulary.upsert({
      where: { id: item.id },
      update: {
        japanese: item.japanese,
        hiragana: item.hiragana,
        romaji: item.romaji,
        vietnamese: item.vietnamese,
        type: item.type,
        topic: item.topic,
        exampleJapanese: item.example.japanese,
        exampleVietnamese: item.example.vietnamese,
      },
      create: {
        id: item.id,
        japanese: item.japanese,
        hiragana: item.hiragana,
        romaji: item.romaji,
        vietnamese: item.vietnamese,
        type: item.type,
        topic: item.topic,
        exampleJapanese: item.example.japanese,
        exampleVietnamese: item.example.vietnamese,
      },
    })
  }

  for (const item of grammarData) {
    await prisma.grammar.upsert({
      where: { id: item.id },
      update: {
        pattern: item.pattern,
        meaning: item.meaning,
        structure: item.structure,
        usageNote: item.usageNote,
        exampleJapanese: item.example.japanese,
        exampleVietnamese: item.example.vietnamese,
        difficulty: mapGrammarDifficulty(item),
        status: mapGrammarStatus(item),
      },
      create: {
        id: item.id,
        pattern: item.pattern,
        meaning: item.meaning,
        structure: item.structure,
        usageNote: item.usageNote,
        exampleJapanese: item.example.japanese,
        exampleVietnamese: item.example.vietnamese,
        difficulty: mapGrammarDifficulty(item),
        status: mapGrammarStatus(item),
      },
    })
  }

  for (const question of quizQuestions) {
    await prisma.quizQuestion.upsert({
      where: { id: question.id },
      update: {
        question: question.question,
        type: question.type,
        difficulty: question.difficulty,
        topic: question.topic,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
      },
      create: {
        id: question.id,
        question: question.question,
        type: question.type,
        difficulty: question.difficulty,
        topic: question.topic,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
      },
    })

    for (const answer of question.answers) {
      await prisma.quizAnswer.upsert({
        where: {
          questionId_answerKey: {
            questionId: question.id,
            answerKey: answer.id,
          },
        },
        update: {
          answerText: answer.text,
        },
        create: {
          questionId: question.id,
          answerKey: answer.id,
          answerText: answer.text,
        },
      })
    }
  }

  for (const item of vocabularyData) {
    await prisma.knowledgeChunk.upsert({
      where: { id: `vocabulary-${item.id}` },
      update: {
        title: `${item.japanese} / ${item.romaji}`,
        content: `${item.japanese} (${item.hiragana}, ${item.romaji}) means ${item.vietnamese}. Example: ${item.example.japanese} - ${item.example.vietnamese}`,
        vocabularyId: item.id,
      },
      create: {
        id: `vocabulary-${item.id}`,
        sourceType: "vocabulary",
        sourceId: String(item.id),
        title: `${item.japanese} / ${item.romaji}`,
        content: `${item.japanese} (${item.hiragana}, ${item.romaji}) means ${item.vietnamese}. Example: ${item.example.japanese} - ${item.example.vietnamese}`,
        vocabularyId: item.id,
      },
    })
  }

  for (const item of grammarData) {
    await prisma.knowledgeChunk.upsert({
      where: { id: `grammar-${item.id}` },
      update: {
        title: item.pattern,
        content: `${item.pattern}: ${item.meaning}. Structure: ${item.structure}. Usage: ${item.usageNote}. Example: ${item.example.japanese} - ${item.example.vietnamese}`,
        grammarId: item.id,
      },
      create: {
        id: `grammar-${item.id}`,
        sourceType: "grammar",
        sourceId: String(item.id),
        title: item.pattern,
        content: `${item.pattern}: ${item.meaning}. Structure: ${item.structure}. Usage: ${item.usageNote}. Example: ${item.example.japanese} - ${item.example.vietnamese}`,
        grammarId: item.id,
      },
    })
  }

  for (const question of quizQuestions) {
    await prisma.knowledgeChunk.upsert({
      where: { id: `quiz-${question.id}` },
      update: {
        title: question.question,
        content: `${question.question}. Correct answer: ${question.correctAnswer}. Explanation: ${question.explanation}`,
        quizId: question.id,
      },
      create: {
        id: `quiz-${question.id}`,
        sourceType: "quiz",
        sourceId: String(question.id),
        title: question.question,
        content: `${question.question}. Correct answer: ${question.correctAnswer}. Explanation: ${question.explanation}`,
        quizId: question.id,
      },
    })
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
