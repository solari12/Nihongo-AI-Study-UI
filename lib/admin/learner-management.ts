export type LearnerGoal = "JLPT_N5" | "COMMUNICATION" | "FROM_ZERO"

export type LearnerInitialLevel = "absolute_beginner" | "early_n5" | "n5_review"

export type LearnerStatus = "active" | "inactive" | "new"

export type LearnerAdminSummary = {
  id: string
  name: string
  email: string
  avatar?: string
  role: "learner" | "admin"
  goal: LearnerGoal
  initialLevel?: LearnerInitialLevel
  n5Progress: number
  learnedVocabulary: number
  totalVocabulary: number
  completedGrammar: number
  totalGrammar: number
  quizAttempts: number
  averageQuizScore: number
  lastActiveAt?: string
  status: LearnerStatus
}

export type LearnerAdminActivity = {
  id: string
  type: "vocabulary" | "vocabulary_session" | "grammar" | "grammar_session" | "reading" | "quiz" | "chatbot" | "review"
  topic: string
  result: string
  date: string
}

export type LearnerAdminRecommendation = {
  id: string
  title: string
  description: string
}

export type LearnerAdminDetail = LearnerAdminSummary & {
  createdAt: string
  dailyMinutes: number
  recentActivities: LearnerAdminActivity[]
  recommendations: LearnerAdminRecommendation[]
}

export const goalLabels: Record<LearnerGoal, string> = {
  JLPT_N5: "JLPT N5",
  COMMUNICATION: "Giao tiếp",
  FROM_ZERO: "Bắt đầu từ số 0",
}

export const initialLevelLabels: Record<LearnerInitialLevel, string> = {
  absolute_beginner: "Mới hoàn toàn",
  early_n5: "Đầu N5",
  n5_review: "Ôn lại N5",
}

export const statusLabels: Record<LearnerStatus, string> = {
  active: "Đang học",
  inactive: "Ít hoạt động",
  new: "Mới",
}

export const activityTypeLabels: Record<LearnerAdminActivity["type"], string> = {
  vocabulary: "Từ vựng",
  vocabulary_session: "Phiên từ vựng",
  grammar: "Ngữ pháp",
  grammar_session: "Phiên ngữ pháp",
  reading: "Bài đọc",
  quiz: "Quiz",
  chatbot: "Kami",
  review: "Ôn tập",
}

export function getLearnerAdminStats(items: LearnerAdminSummary[]) {
  const activeCount = items.filter((learner) => learner.status === "active").length
  const lowActivityCount = items.filter((learner) => learner.status === "inactive").length
  const scoredLearners = items.filter((learner) => learner.quizAttempts > 0)
  const averageQuizScore = scoredLearners.length
    ? Math.round(scoredLearners.reduce((total, learner) => total + learner.averageQuizScore, 0) / scoredLearners.length)
    : 0

  return {
    totalLearners: items.length,
    activeCount,
    lowActivityCount,
    averageQuizScore,
  }
}
