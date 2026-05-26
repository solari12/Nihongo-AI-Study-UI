import type { LearningActivity } from "@/hooks/use-activity-log"
import type { AdminContent } from "@/hooks/use-admin-content"
import type { LearnerProfile, PlacementResult } from "@/hooks/use-learner-profile"

export type RecommendationType = "vocabulary" | "grammar" | "quiz" | "review"

export type Recommendation = {
  id: string
  type: RecommendationType
  title: string
  reason: string
  priority: number
  estimatedTime: string
  targetUrl: string
  explanation: {
    method: "BKT+SM2"
    factors: {
      label: string
      contribution: number
    }[]
  }
}

type ProgressSnapshot = {
  learnedVocabularyIds: number[]
  reviewVocabularyIds: number[]
  latestQuizScore: number
  averageQuizScore: number
  quizAttempts: number
}

const bktDefaults = {
  priorMastery: 0.35,
  learnRate: 0.18,
  slip: 0.1,
  guess: 0.25,
}

function estimateMasteryFromQuiz(score: number) {
  const correctProbability = Math.max(0, Math.min(1, score / 100))
  const { priorMastery, learnRate, slip, guess } = bktDefaults
  const numerator = priorMastery * (correctProbability * (1 - slip) + (1 - correctProbability) * slip)
  const denominator =
    numerator +
    (1 - priorMastery) * (correctProbability * guess + (1 - correctProbability) * (1 - guess))
  const posterior = denominator ? numerator / denominator : priorMastery

  return posterior + (1 - posterior) * learnRate
}

function daysSince(date: string) {
  const elapsed = Date.now() - new Date(date).getTime()
  return Math.max(0, elapsed / (1000 * 60 * 60 * 24))
}

function clampPriority(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)))
}

function buildExplanation(factors: Recommendation["explanation"]["factors"]) {
  return {
    method: "BKT+SM2" as const,
    factors,
  }
}

export function generateRecommendations({
  content,
  progress,
  activities,
  profile,
  placement,
}: {
  content: AdminContent
  progress: ProgressSnapshot
  activities: LearningActivity[]
  profile?: LearnerProfile
  placement?: PlacementResult
}): Recommendation[] {
  const latestActivity = activities[0]
  const daysFromLatestActivity = latestActivity ? daysSince(latestActivity.createdAt) : 7
  const quizMastery = progress.quizAttempts
    ? estimateMasteryFromQuiz(progress.latestQuizScore || progress.averageQuizScore)
    : 0.25
  const learnedVocabularyRatio = content.vocabulary.length
    ? progress.learnedVocabularyIds.length / content.vocabulary.length
    : 0
  const completedGrammarRatio = content.grammar.length
    ? content.grammar.filter((item) => item.status === "Đã hoàn thành").length / content.grammar.length
    : 0
  const reviewLoad = content.vocabulary.length
    ? progress.reviewVocabularyIds.length / content.vocabulary.length
    : 0

  const unlearnedVocabulary = content.vocabulary.find(
    (item) => !progress.learnedVocabularyIds.includes(item.id)
  )
  const nextGrammar = content.grammar.find((item) => item.status !== "Đã hoàn thành")

  const recommendations: Recommendation[] = []

  if (!profile?.completedOnboarding) {
    recommendations.push({
      id: "onboarding-create-profile",
      type: "review",
      title: "Khởi tạo hồ sơ học tập",
      reason: "Người mới cần cung cấp mục tiêu, trình độ kana và thời gian học để hệ thống tạo lộ trình phù hợp.",
      priority: 100,
      estimatedTime: "3 phút",
      targetUrl: "/onboarding",
      explanation: buildExplanation([
        { label: "Chưa có hồ sơ người học", contribution: 60 },
        { label: "Cần dữ liệu đầu vào cho recommendation", contribution: 40 },
      ]),
    })
  }

  if (profile?.completedOnboarding && !placement?.completed) {
    recommendations.push({
      id: "placement-test-first",
      type: "quiz",
      title: "Làm kiểm tra đầu vào",
      reason: "Placement test giúp xác định bạn nên bắt đầu từ kana, từ vựng nền tảng hay ôn tập N5.",
      priority: 98,
      estimatedTime: "5 phút",
      targetUrl: "/placement-test",
      explanation: buildExplanation([
        { label: "Đã có hồ sơ nhưng chưa có level ban đầu", contribution: 58 },
        { label: "Cần phân loại điểm yếu", contribution: 40 },
      ]),
    })
  }

  if (placement?.completed && placement.recommendedStart === "kana-basics") {
    recommendations.push({
      id: "placement-kana-basics",
      type: "vocabulary",
      title: "Bắt đầu với kana và từ vựng nền tảng",
      reason: "Kết quả đầu vào cho thấy kana là điểm cần xử lý trước khi học nhiều từ N5.",
      priority: 94,
      estimatedTime: `${Math.min(profile?.dailyMinutes ?? 20, 20)} phút`,
      targetUrl: "/vocabulary",
      explanation: buildExplanation([
        { label: "Placement test yếu kana", contribution: 45 },
        { label: "Mục tiêu xây nền tảng trước", contribution: 35 },
      ]),
    })
  }

  if (placement?.completed && placement.weakAreas.includes("grammar")) {
    recommendations.push({
      id: "placement-grammar-foundation",
      type: "grammar",
      title: "Củng cố ngữ pháp câu danh từ",
      reason: "Placement test phát hiện ngữ pháp nền tảng còn yếu, nên học lại mẫu câu cơ bản trước.",
      priority: 88,
      estimatedTime: `${Math.min(profile?.dailyMinutes ?? 20, 20)} phút`,
      targetUrl: "/grammar",
      explanation: buildExplanation([
        { label: "Điểm yếu ngữ pháp", contribution: 45 },
        { label: "Phù hợp lộ trình N5 đầu vào", contribution: 30 },
      ]),
    })
  }

  if (progress.reviewVocabularyIds.length > 0) {
    const recencyBoost = Math.min(30, daysFromLatestActivity * 8)
    const reviewBoost = reviewLoad * 60
    recommendations.push({
      id: "sm2-review-vocabulary",
      type: "review",
      title: `Ôn tập ${progress.reviewVocabularyIds.length} từ cần nhớ`,
      reason: "SM-2 ưu tiên ôn lại nội dung đã được đưa vào danh sách review để giảm quên.",
      priority: clampPriority(45 + recencyBoost + reviewBoost),
      estimatedTime: "10 phút",
      targetUrl: "/vocabulary",
      explanation: buildExplanation([
        { label: "Số từ cần ôn", contribution: Math.round(reviewBoost) },
        { label: "Khoảng cách từ lần học gần nhất", contribution: Math.round(recencyBoost) },
      ]),
    })
  }

  if (quizMastery < 0.65) {
    const masteryGap = (0.65 - quizMastery) * 100
    recommendations.push({
      id: "bkt-quiz-remediation",
      type: "quiz",
      title: "Làm quiz củng cố kiến thức yếu",
      reason: "BKT ước lượng mức nắm kiến thức còn thấp dựa trên kết quả quiz gần nhất.",
      priority: clampPriority(55 + masteryGap),
      estimatedTime: "12 phút",
      targetUrl: "/quiz",
      explanation: buildExplanation([
        { label: "Khoảng cách tới mức mastery 65%", contribution: Math.round(masteryGap) },
        { label: "Điểm quiz gần nhất", contribution: progress.latestQuizScore ? 10 : 0 },
      ]),
    })
  }

  if (unlearnedVocabulary) {
    const vocabularyGap = (1 - learnedVocabularyRatio) * 40
    recommendations.push({
      id: "content-next-vocabulary",
      type: "vocabulary",
      title: `Học từ mới: ${unlearnedVocabulary.topic}`,
      reason: `Bạn còn từ chưa học, bắt đầu với "${unlearnedVocabulary.japanese}" (${unlearnedVocabulary.vietnamese}).`,
      priority: clampPriority(35 + vocabularyGap),
      estimatedTime: "15 phút",
      targetUrl: "/vocabulary",
      explanation: buildExplanation([
        { label: "Tỷ lệ từ vựng chưa học", contribution: Math.round(vocabularyGap) },
        { label: "Có nội dung tiếp theo trong giáo trình", contribution: 15 },
      ]),
    })
  }

  if (nextGrammar) {
    const grammarGap = (1 - completedGrammarRatio) * 35
    recommendations.push({
      id: "content-next-grammar",
      type: "grammar",
      title: `Học ngữ pháp: ${nextGrammar.pattern}`,
      reason: "Hệ thống chọn mẫu ngữ pháp chưa hoàn thành tiếp theo trong lộ trình N5.",
      priority: clampPriority(30 + grammarGap),
      estimatedTime: "15 phút",
      targetUrl: "/grammar",
      explanation: buildExplanation([
        { label: "Tỷ lệ ngữ pháp chưa hoàn thành", contribution: Math.round(grammarGap) },
        { label: "Mức độ phù hợp N5", contribution: 12 },
      ]),
    })
  }

  if (!activities.length || daysFromLatestActivity >= 2) {
    const inactivityBoost = Math.min(40, daysFromLatestActivity * 10)
    recommendations.push({
      id: "habit-short-session",
      type: "review",
      title: "Phiên học ngắn để giữ nhịp",
      reason: "Bạn chưa có hoạt động gần đây, hệ thống đề xuất một phiên 10 phút để duy trì thói quen.",
      priority: clampPriority(40 + inactivityBoost),
      estimatedTime: "10 phút",
      targetUrl: "/learning-path",
      explanation: buildExplanation([
        { label: "Số ngày chưa học", contribution: Math.round(inactivityBoost) },
        { label: "Mục tiêu duy trì streak", contribution: 10 },
      ]),
    })
  }

  return recommendations.sort((a, b) => b.priority - a.priority).slice(0, 6)
}
