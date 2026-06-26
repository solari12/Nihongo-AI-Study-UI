import { config } from "dotenv"
import { randomBytes, scryptSync } from "node:crypto"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../lib/generated/prisma/client"
import { normalizeVocabularyTopicKey } from "../lib/vocabulary/topics"
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

const demoLearnerPassword = "password123"

function vocabularyIds(count: number) {
  return Array.from({ length: Math.min(count, 205) }, (_, index) => index + 1)
}

function buildStudyActivities(options: {
  prefix: string
  vocabularySessions: number
  grammarSessions: number
  readings: number
  chatbot: number
  startDaysAgo?: number
}) {
  const startDaysAgo = options.startDaysAgo ?? 0
  const activities: Array<{
    type: string
    content: string
    topic: string
    result: string
    score?: number
    durationMinutes: number
    daysAgo: number
  }> = []

  for (let index = 0; index < options.vocabularySessions; index += 1) {
    const total = 8 + (index % 8)
    activities.push({
      type: "vocabulary_session",
      content: `Hoan thanh phien tu vung ${options.prefix}: ${total}/${total} tu nho tot`,
      topic: ["school", "food", "family", "time", "movement", "adjectives"][index % 6],
      result: "completed",
      durationMinutes: 8 + (index % 10),
      daysAgo: startDaysAgo + (index % 14),
    })
  }

  for (let index = 0; index < options.grammarSessions; index += 1) {
    activities.push({
      type: "grammar_session",
      content: `Hoan thanh phien ngu phap ${options.prefix}: mau cau ${index + 1}`,
      topic: ["です / ます", "は / が", "から / まで", "て form", "ない form", "adjective sentence"][index % 6],
      result: "completed",
      durationMinutes: 10 + (index % 12),
      daysAgo: startDaysAgo + ((index + 2) % 18),
    })
  }

  for (let index = 0; index < options.readings; index += 1) {
    activities.push({
      type: "reading",
      content: `Da mo bai doc ${options.prefix}: bai doc N5 so ${index + 1}`,
      topic: ["N5", "daily life", "shopping", "travel"][index % 4],
      result: index % 3 === 0 ? "Da tom tat voi Kami" : "Hoan thanh bai doc",
      durationMinutes: 7 + (index % 9),
      daysAgo: startDaysAgo + ((index + 1) % 12),
    })
  }

  for (let index = 0; index < options.chatbot; index += 1) {
    activities.push({
      type: "chatbot",
      content: `Hoi Kami ${options.prefix}: cau hoi hoc tap ${index + 1}`,
      topic: ["Tro tu", "Tu vung", "Ngu phap", "Bai doc"][index % 4],
      result: "Da duoc giai thich",
      durationMinutes: 4 + (index % 6),
      daysAgo: startDaysAgo + ((index + 3) % 10),
    })
  }

  return activities
}

const demoLearners = [
  {
    id: "demo-learner-minh-anh",
    fullName: "Nguyen Minh Anh",
    email: "minhanh.n5@example.com",
    profile: {
      goal: "JLPT_N5" as const,
      kanaLevel: "hiragana_katakana" as const,
      dailyMinutes: 30,
      experience: "some" as const,
      preferredTopics: ["Truong hoc", "Tinh tu", "Thoi gian"],
      coldStartScore: 46,
      coldStartReasons: ["Da biet hiragana", "Can on tro tu co ban"],
      guideCompletedSteps: ["profile:goal:JLPT_N5", "profile:dailyMinutes:30"],
      completedOnboarding: true,
    },
    placement: {
      score: 7,
      total: 10,
      percentage: 70,
      level: "early_n5" as const,
      weakAreas: ["tro tu", "doc hieu ngan"],
      recommendedStart: "n5-core-review",
    },
    vocabularyIds: vocabularyIds(132),
    quizScores: [78, 82, 85, 88, 90, 84, 92, 86],
    activities: [
      { type: "quiz", content: "Hoan thanh quiz tong hop N5", topic: "N5", result: "18/20 cau dung", score: 90, durationMinutes: 18, daysAgo: 0 },
      ...buildStudyActivities({ prefix: "Minh Anh", vocabularySessions: 14, grammarSessions: 13, readings: 7, chatbot: 5 }),
    ],
  },
  {
    id: "demo-learner-gia-bao",
    fullName: "Tran Gia Bao",
    email: "giabao.study@example.com",
    profile: {
      goal: "FROM_ZERO" as const,
      kanaLevel: "hiragana" as const,
      dailyMinutes: 20,
      experience: "new" as const,
      preferredTopics: ["Chao hoi", "Gia dinh", "Truong hoc"],
      coldStartScore: 18,
      coldStartReasons: ["Moi bat dau", "Can on kana"],
      guideCompletedSteps: ["profile:goal:FROM_ZERO", "profile:dailyMinutes:20"],
      completedOnboarding: true,
    },
    placement: {
      score: 3,
      total: 10,
      percentage: 30,
      level: "absolute_beginner" as const,
      weakAreas: ["kana", "tu vung nen"],
      recommendedStart: "kana-basics",
    },
    vocabularyIds: vocabularyIds(72),
    quizScores: [55, 65, 70, 68, 74],
    activities: [
      { type: "quiz", content: "Hoan thanh quiz tu vung dau N5", topic: "Vocabulary", result: "7/10 cau dung", score: 70, durationMinutes: 10, daysAgo: 1 },
      ...buildStudyActivities({ prefix: "Gia Bao", vocabularySessions: 10, grammarSessions: 6, readings: 3, chatbot: 6 }),
    ],
  },
  {
    id: "demo-learner-khanh-chi",
    fullName: "Le Khanh Chi",
    email: "khanhchi.jp@example.com",
    profile: {
      goal: "COMMUNICATION" as const,
      kanaLevel: "hiragana_katakana" as const,
      dailyMinutes: 25,
      experience: "some" as const,
      preferredTopics: ["Giao tiep", "Mua sam", "Du lich"],
      coldStartScore: 40,
      coldStartReasons: ["Muon giao tiep co ban"],
      guideCompletedSteps: ["profile:goal:COMMUNICATION", "profile:dailyMinutes:25"],
      completedOnboarding: true,
    },
    placement: {
      score: 6,
      total: 10,
      percentage: 60,
      level: "early_n5" as const,
      weakAreas: ["mau cau hoi thoai"],
      recommendedStart: "communication-basics",
    },
    vocabularyIds: vocabularyIds(118),
    quizScores: [70, 75, 80, 82, 78, 85],
    activities: [
      { type: "quiz", content: "Hoan thanh quiz giao tiep co ban", topic: "Communication", result: "8/10 cau dung", score: 80, durationMinutes: 10, daysAgo: 2 },
      ...buildStudyActivities({ prefix: "Khanh Chi", vocabularySessions: 12, grammarSessions: 10, readings: 9, chatbot: 7 }),
    ],
  },
  {
    id: "demo-learner-hoang-duy",
    fullName: "Pham Hoang Duy",
    email: "duypham.nihongo@example.com",
    profile: {
      goal: "JLPT_N5" as const,
      kanaLevel: "hiragana_katakana" as const,
      dailyMinutes: 45,
      experience: "returning" as const,
      preferredTopics: ["JLPT", "Doc hieu", "Ngu phap"],
      coldStartScore: 72,
      coldStartReasons: ["Dang on thi N5"],
      guideCompletedSteps: ["profile:goal:JLPT_N5", "profile:planType:review"],
      completedOnboarding: true,
    },
    placement: {
      score: 8,
      total: 10,
      percentage: 80,
      level: "n5_review" as const,
      weakAreas: ["doc hieu dai"],
      recommendedStart: "n5-reading-practice",
    },
    vocabularyIds: vocabularyIds(184),
    quizScores: [85, 90, 88, 95, 82, 92, 96, 89, 94],
    activities: [
      { type: "quiz", content: "Hoan thanh de luyen N5", topic: "JLPT N5", result: "19/20 cau dung", score: 95, durationMinutes: 22, daysAgo: 0 },
      ...buildStudyActivities({ prefix: "Hoang Duy", vocabularySessions: 18, grammarSessions: 18, readings: 10, chatbot: 4 }),
    ],
  },
  {
    id: "demo-learner-ngoc-ha",
    fullName: "Vo Ngoc Ha",
    email: "ngocha.learn@example.com",
    profile: {
      goal: "FROM_ZERO" as const,
      kanaLevel: "none" as const,
      dailyMinutes: 15,
      experience: "new" as const,
      preferredTopics: ["Chao hoi"],
      coldStartScore: 5,
      coldStartReasons: ["Chua biet kana"],
      guideCompletedSteps: ["profile:goal:FROM_ZERO"],
      completedOnboarding: true,
    },
    placement: {
      score: 1,
      total: 10,
      percentage: 10,
      level: "absolute_beginner" as const,
      weakAreas: ["kana", "tu vung co ban"],
      recommendedStart: "kana-basics",
    },
    vocabularyIds: vocabularyIds(24),
    quizScores: [35, 45],
    activities: [
      { type: "vocabulary_session", content: "Bat dau phien tu vung dau tien", topic: "greetings", result: "completed", durationMinutes: 7, daysAgo: 0 },
      ...buildStudyActivities({ prefix: "Ngoc Ha", vocabularySessions: 4, grammarSessions: 1, readings: 1, chatbot: 3 }),
    ],
  },
  {
    id: "demo-learner-thuy-linh",
    fullName: "Dang Thuy Linh",
    email: "linh.dang@example.com",
    profile: {
      goal: "COMMUNICATION" as const,
      kanaLevel: "hiragana" as const,
      dailyMinutes: 30,
      experience: "some" as const,
      preferredTopics: ["Giao tiep", "Cong viec", "An uong"],
      coldStartScore: 34,
      coldStartReasons: ["Can luyen cau hoi dap"],
      guideCompletedSteps: ["profile:goal:COMMUNICATION", "profile:dailyMinutes:30"],
      completedOnboarding: true,
    },
    placement: {
      score: 5,
      total: 10,
      percentage: 50,
      level: "early_n5" as const,
      weakAreas: ["hoi thoai", "tu noi"],
      recommendedStart: "daily-conversation",
    },
    vocabularyIds: vocabularyIds(96),
    quizScores: [62, 68, 72, 76, 80],
    activities: [
      { type: "chatbot", content: "Luyen hoi thoai gioi thieu ban than voi Kami", topic: "Conversation", result: "Da nhan vi du", durationMinutes: 8, daysAgo: 0 },
      ...buildStudyActivities({ prefix: "Thuy Linh", vocabularySessions: 11, grammarSessions: 8, readings: 6, chatbot: 9 }),
    ],
  },
  {
    id: "demo-learner-nhat-nam",
    fullName: "Bui Nhat Nam",
    email: "nhatnam.n5@example.com",
    profile: {
      goal: "JLPT_N5" as const,
      kanaLevel: "hiragana_katakana" as const,
      dailyMinutes: 35,
      experience: "some" as const,
      preferredTopics: ["Ngu phap", "Quiz", "Doc hieu"],
      coldStartScore: 58,
      coldStartReasons: ["Tien do deu", "Can on ngu phap"],
      guideCompletedSteps: ["profile:goal:JLPT_N5", "profile:dailyMinutes:35"],
      completedOnboarding: true,
    },
    placement: {
      score: 7,
      total: 10,
      percentage: 70,
      level: "early_n5" as const,
      weakAreas: ["ngu phap lien ket"],
      recommendedStart: "grammar-review",
    },
    vocabularyIds: vocabularyIds(146),
    quizScores: [74, 78, 82, 79, 86, 84, 88],
    activities: [
      { type: "quiz", content: "Hoan thanh quiz ngu phap", topic: "Grammar", result: "17/20 cau dung", score: 85, durationMinutes: 17, daysAgo: 1 },
      ...buildStudyActivities({ prefix: "Nhat Nam", vocabularySessions: 16, grammarSessions: 15, readings: 8, chatbot: 5 }),
    ],
  },
  {
    id: "demo-learner-mai-phuong",
    fullName: "Hoang Mai Phuong",
    email: "maiphuong.jp@example.com",
    profile: {
      goal: "FROM_ZERO" as const,
      kanaLevel: "hiragana_katakana" as const,
      dailyMinutes: 40,
      experience: "returning" as const,
      preferredTopics: ["Du lich", "Mua sam", "Thoi gian"],
      coldStartScore: 62,
      coldStartReasons: ["Hoc lai sau thoi gian nghi"],
      guideCompletedSteps: ["profile:goal:FROM_ZERO", "profile:planType:review"],
      completedOnboarding: true,
    },
    placement: {
      score: 6,
      total: 10,
      percentage: 60,
      level: "n5_review" as const,
      weakAreas: ["kanji co ban", "doc hieu"],
      recommendedStart: "n5-core-review",
    },
    vocabularyIds: vocabularyIds(164),
    quizScores: [68, 72, 77, 81, 83, 79],
    activities: [
      { type: "reading", content: "Hoan thanh bai doc ve du lich", topic: "Travel", result: "Hoan thanh bai doc", durationMinutes: 16, daysAgo: 3 },
      ...buildStudyActivities({ prefix: "Mai Phuong", vocabularySessions: 15, grammarSessions: 14, readings: 11, chatbot: 6 }),
    ],
  },
  {
    id: "demo-learner-quoc-huy",
    fullName: "Nguyen Quoc Huy",
    email: "quochuy.n5@example.com",
    profile: {
      goal: "JLPT_N5" as const,
      kanaLevel: "hiragana_katakana" as const,
      dailyMinutes: 50,
      experience: "returning" as const,
      preferredTopics: ["JLPT", "Tu vung", "De thi"],
      coldStartScore: 78,
      coldStartReasons: ["Muc tieu thi N5 gan"],
      guideCompletedSteps: ["profile:goal:JLPT_N5", "profile:dailyMinutes:50"],
      completedOnboarding: true,
    },
    placement: {
      score: 9,
      total: 10,
      percentage: 90,
      level: "n5_review" as const,
      weakAreas: ["toc do doc"],
      recommendedStart: "mock-test",
    },
    vocabularyIds: vocabularyIds(198),
    quizScores: [90, 92, 88, 94, 96, 91, 95, 93],
    activities: [
      { type: "quiz", content: "Hoan thanh mock test N5", topic: "JLPT N5", result: "46/50 cau dung", score: 92, durationMinutes: 45, daysAgo: 0 },
      ...buildStudyActivities({ prefix: "Quoc Huy", vocabularySessions: 20, grammarSessions: 21, readings: 12, chatbot: 5 }),
    ],
  },
]

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
}

async function seedDemoLearner(learner: (typeof demoLearners)[number]) {
  const user = await prisma.user.upsert({
    where: { email: learner.email },
    update: {
      fullName: learner.fullName,
      passwordHash: hashSeedPassword(demoLearnerPassword),
      role: "learner",
    },
    create: {
      id: learner.id,
      fullName: learner.fullName,
      email: learner.email,
      passwordHash: hashSeedPassword(demoLearnerPassword),
      role: "learner",
      createdAt: daysAgo(30),
    },
  })

  await Promise.all([
    prisma.userVocabularyProgress.deleteMany({ where: { userId: user.id } }),
    prisma.quizAttempt.deleteMany({ where: { userId: user.id } }),
    prisma.activityLog.deleteMany({ where: { userId: user.id } }),
  ])

  await prisma.learnerProfile.upsert({
    where: { userId: user.id },
    update: learner.profile,
    create: {
      userId: user.id,
      ...learner.profile,
    },
  })

  await prisma.placementResult.upsert({
    where: { userId: user.id },
    update: {
      ...learner.placement,
      completedAt: daysAgo(12),
    },
    create: {
      userId: user.id,
      ...learner.placement,
      completedAt: daysAgo(12),
    },
  })

  for (const [index, vocabularyId] of learner.vocabularyIds.entries()) {
    await prisma.userVocabularyProgress.create({
      data: {
        userId: user.id,
        vocabularyId,
        stage: index % 5 === 0 ? "mastered" : index % 3 === 0 ? "learning" : "review",
        repetitions: index % 5 === 0 ? 4 : index % 3 === 0 ? 1 : 2,
        intervalDays: index % 5 === 0 ? 7 : 2,
        easeFactor: 2.5,
        lastQuality: index % 3 === 0 ? 3 : 5,
        lapses: index % 9 === 0 ? 1 : 0,
        lastReviewedAt: daysAgo(index % 6),
        dueAt: daysAgo(index % 4),
      },
    })
  }

  for (const [index, percentage] of learner.quizScores.entries()) {
    const total = index % 2 === 0 ? 10 : 20
    await prisma.quizAttempt.create({
      data: {
        userId: user.id,
        quizType: index % 2 === 0 ? "vocabulary" : "grammar",
        score: Math.round((percentage / 100) * total),
        total,
        percentage,
        createdAt: daysAgo(Math.max(0, learner.quizScores.length - index - 1)),
      },
    })
  }

  for (const activity of learner.activities) {
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        type: activity.type,
        content: activity.content,
        topic: activity.topic,
        result: activity.result,
        score: "score" in activity ? activity.score : undefined,
        durationMinutes: activity.durationMinutes,
        createdAt: daysAgo(activity.daysAgo),
      },
    })
  }
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
        topicKey: normalizeVocabularyTopicKey(item.topic),
        partOfSpeech:
          item.type.includes("Danh") ? "noun" :
          item.type.includes("Động") ? "verb" :
          item.type.includes("Tính") ? "i_adjective" :
          "expression",
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
        topicKey: normalizeVocabularyTopicKey(item.topic),
        partOfSpeech:
          item.type.includes("Danh") ? "noun" :
          item.type.includes("Động") ? "verb" :
          item.type.includes("Tính") ? "i_adjective" :
          "expression",
        exampleJapanese: item.example.japanese,
        exampleVietnamese: item.example.vietnamese,
      },
    })
  }

  for (const vocabularyId of [1, 2, 5, 8]) {
    await prisma.userVocabularyProgress.upsert({
      where: {
        userId_vocabularyId: {
          userId: "demo-learner",
          vocabularyId,
        },
      },
      update: {
        stage: "review",
        repetitions: 1,
        intervalDays: 1,
        easeFactor: 2.5,
        lastQuality: 5,
        lapses: 0,
        lastReviewedAt: new Date(),
        dueAt: new Date(),
      },
      create: {
        userId: "demo-learner",
        vocabularyId,
        stage: "review",
        repetitions: 1,
        intervalDays: 1,
        easeFactor: 2.5,
        lastQuality: 5,
        lapses: 0,
        lastReviewedAt: new Date(),
        dueAt: new Date(),
      },
    })
  }

  for (const vocabularyId of [3, 6]) {
    await prisma.userVocabularyProgress.upsert({
      where: {
        userId_vocabularyId: {
          userId: "demo-learner",
          vocabularyId,
        },
      },
      update: {
        stage: "learning",
        repetitions: 0,
        intervalDays: 1,
        easeFactor: 2.5,
        lastQuality: 1,
        lapses: 1,
        lastReviewedAt: new Date(),
        dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      create: {
        userId: "demo-learner",
        vocabularyId,
        stage: "learning",
        repetitions: 0,
        intervalDays: 1,
        easeFactor: 2.5,
        lastQuality: 1,
        lapses: 1,
        lastReviewedAt: new Date(),
        dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    })
  }

  for (const learner of demoLearners) {
    await seedDemoLearner(learner)
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
