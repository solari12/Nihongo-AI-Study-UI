import { prisma } from "@/lib/prisma"
import type {
  LearnerAdminActivity,
  LearnerAdminDetail,
  LearnerAdminRecommendation,
  LearnerAdminSummary,
  LearnerGoal,
  LearnerInitialLevel,
  LearnerStatus,
} from "@/lib/admin/learner-management"

const activeWindowMs = 7 * 24 * 60 * 60 * 1000
const newWindowMs = 7 * 24 * 60 * 60 * 1000

function latestDate(...dates: Array<Date | null | undefined>) {
  return dates.filter((date): date is Date => Boolean(date)).sort((a, b) => b.getTime() - a.getTime())[0]
}

function inferStatus(createdAt: Date, lastActiveAt?: Date): LearnerStatus {
  const now = Date.now()
  if (!lastActiveAt && now - createdAt.getTime() <= newWindowMs) return "new"
  if (lastActiveAt && now - lastActiveAt.getTime() <= activeWindowMs) return "active"
  return "inactive"
}

function normalizeActivityType(type: string): LearnerAdminActivity["type"] {
  if (
    type === "vocabulary" ||
    type === "vocabulary_session" ||
    type === "grammar" ||
    type === "grammar_session" ||
    type === "reading" ||
    type === "quiz" ||
    type === "chatbot" ||
    type === "review"
  ) {
    return type
  }

  if (type.includes("chat")) return "chatbot"
  if (type.includes("read")) return "reading"
  return "review"
}

function buildRecommendations(input: {
  n5Progress: number
  learnedVocabulary: number
  completedGrammar: number
  averageQuizScore: number
  quizAttempts: number
  status: LearnerStatus
}): LearnerAdminRecommendation[] {
  const recommendations: LearnerAdminRecommendation[] = []

  if (input.status === "inactive") {
    recommendations.push({
      id: "return-light-session",
      title: "Gợi ý phiên học ngắn",
      description: "Học viên đang ít hoạt động, nên bắt đầu lại bằng một phiên 10 phút dễ hoàn thành.",
    })
  }

  if (input.quizAttempts === 0) {
    recommendations.push({
      id: "first-quiz",
      title: "Làm quiz đầu tiên",
      description: "Chưa có dữ liệu quiz, nên tạo một bài kiểm tra ngắn để xác định mức ghi nhớ.",
    })
  } else if (input.averageQuizScore < 70) {
    recommendations.push({
      id: "review-before-quiz",
      title: "Ôn lại trước khi làm quiz",
      description: "Điểm quiz trung bình còn thấp, nên ưu tiên ôn từ vựng và mẫu câu đã sai.",
    })
  }

  if (input.learnedVocabulary < 50) {
    recommendations.push({
      id: "build-vocab-base",
      title: "Tăng nền từ vựng",
      description: "Nên học thêm nhóm từ N5 cơ bản trước khi chuyển sang bài đọc dài.",
    })
  } else if (input.completedGrammar < 15) {
    recommendations.push({
      id: "grammar-foundation",
      title: "Củng cố ngữ pháp nền",
      description: "Từ vựng đã có nhịp, nên thêm phiên ngữ pháp ngắn để ghép câu tốt hơn.",
    })
  } else if (input.n5Progress >= 60) {
    recommendations.push({
      id: "longer-reading",
      title: "Luyện bài đọc dài hơn",
      description: "Tiến độ N5 khá ổn, nên tăng độ dài bài đọc và quiz tổng hợp.",
    })
  }

  return recommendations.slice(0, 3)
}

async function getTotalCounts() {
  const [totalVocabulary, totalGrammar] = await Promise.all([
    prisma.vocabulary.count(),
    prisma.grammar.count(),
  ])

  return { totalVocabulary, totalGrammar }
}

async function getUsersWithLearningData() {
  return prisma.user.findMany({
    where: { role: "learner" },
    orderBy: { createdAt: "desc" },
    include: {
      learnerProfile: true,
      placementResult: true,
      vocabularyProgress: {
        orderBy: { updatedAt: "desc" },
      },
      quizAttempts: {
        orderBy: { createdAt: "desc" },
      },
      activityLogs: {
        orderBy: { createdAt: "desc" },
        take: 80,
      },
    },
  })
}

function buildLearnerSummary(
  user: Awaited<ReturnType<typeof getUsersWithLearningData>>[number],
  totalVocabulary: number,
  totalGrammar: number
): LearnerAdminSummary {
  const learnedVocabulary = user.vocabularyProgress.length
  const completedGrammar = Math.min(
    totalGrammar,
    user.activityLogs.filter((activity) => activity.type === "grammar_session" && activity.result === "completed").length
  )
  const quizAttempts = user.quizAttempts.length
  const averageQuizScore = quizAttempts
    ? Math.round(user.quizAttempts.reduce((total, attempt) => total + attempt.percentage, 0) / quizAttempts)
    : 0
  const latestActivity = latestDate(
    user.activityLogs[0]?.createdAt,
    user.quizAttempts[0]?.createdAt,
    user.vocabularyProgress[0]?.updatedAt
  )
  const n5Progress = Math.min(
    100,
    Math.round(
      (learnedVocabulary / Math.max(totalVocabulary, 1)) * 45 +
        (completedGrammar / Math.max(totalGrammar, 1)) * 35 +
        (averageQuizScore / 100) * 20
    )
  )
  const status = inferStatus(user.createdAt, latestActivity)

  return {
    id: user.id,
    name: user.fullName,
    email: user.email,
    role: user.role,
    goal: (user.learnerProfile?.goal ?? "FROM_ZERO") as LearnerGoal,
    initialLevel: user.placementResult?.level as LearnerInitialLevel | undefined,
    n5Progress,
    learnedVocabulary,
    totalVocabulary,
    completedGrammar,
    totalGrammar,
    quizAttempts,
    averageQuizScore,
    lastActiveAt: latestActivity?.toISOString(),
    status,
  }
}

export async function getLearnerAdminSummariesFromDatabase() {
  const [{ totalVocabulary, totalGrammar }, users] = await Promise.all([
    getTotalCounts(),
    getUsersWithLearningData(),
  ])

  return users
    .map((user) => buildLearnerSummary(user, totalVocabulary, totalGrammar))
    .sort((a, b) => {
      const latestA = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0
      const latestB = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0

      return latestB - latestA || b.n5Progress - a.n5Progress
    })
}

export async function getLearnerAdminDetailFromDatabase(id: string): Promise<LearnerAdminDetail | null> {
  const [{ totalVocabulary, totalGrammar }, user] = await Promise.all([
    getTotalCounts(),
    prisma.user.findFirst({
      where: { id, role: "learner" },
      include: {
        learnerProfile: true,
        placementResult: true,
        vocabularyProgress: {
          orderBy: { updatedAt: "desc" },
        },
        quizAttempts: {
          orderBy: { createdAt: "desc" },
        },
        activityLogs: {
          orderBy: { createdAt: "desc" },
          take: 80,
        },
      },
    }),
  ])

  if (!user) return null

  const summary = buildLearnerSummary(user, totalVocabulary, totalGrammar)
  const recentActivities: LearnerAdminActivity[] = user.activityLogs.slice(0, 12).map((activity) => ({
    id: activity.id,
    type: normalizeActivityType(activity.type),
    topic: activity.topic ?? activity.content,
    result: activity.result ?? (activity.score != null ? `${activity.score}%` : "Đã ghi nhận"),
    date: activity.createdAt.toISOString(),
  }))

  return {
    ...summary,
    createdAt: user.createdAt.toISOString(),
    dailyMinutes: user.learnerProfile?.dailyMinutes ?? 30,
    recentActivities,
    recommendations: buildRecommendations(summary),
  }
}

const learnerManagementServer = {
  getLearnerAdminSummariesFromDatabase,
  getLearnerAdminDetailFromDatabase,
}

export default learnerManagementServer
