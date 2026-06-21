import type { LearningActivity } from "@/hooks/use-activity-log"
import type { AdminContent } from "@/hooks/use-admin-content"
import type { LearnerProfile, PlacementResult } from "@/hooks/use-learner-profile"
import { buildGrammarSessionHref } from "@/lib/grammar/session-config"
import { buildVocabularySessionHref } from "@/lib/vocabulary/session-config"

export type RecommendationType = "vocabulary" | "grammar" | "quiz" | "review"

export type Recommendation = {
  id: string
  type: RecommendationType
  title: string
  reason: string
  action: string
  expectedOutcome: string
  priority: number
  riskScore: number
  masteryScore: number
  learningState: "cold-start" | "at-risk" | "needs-review" | "on-track"
  estimatedTime: string
  targetUrl: string
  evidence: string[]
  explanation: {
    method: "Rule-based XAI + BKT/SM-2"
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
    method: "Rule-based XAI + BKT/SM-2" as const,
    factors,
  }
}

function isSameDay(firstDate: string, secondDate = new Date()) {
  const first = new Date(firstDate)

  return (
    first.getFullYear() === secondDate.getFullYear() &&
    first.getMonth() === secondDate.getMonth() &&
    first.getDate() === secondDate.getDate()
  )
}

function isCompletedSessionActivity(activity: LearningActivity, type: "vocabulary_session" | "grammar_session") {
  return activity.type === type && activity.result === "completed" && isSameDay(activity.createdAt)
}

function pickNextVocabulary(
  vocabulary: AdminContent["vocabulary"],
  learnedVocabularyIds: number[],
  preferredTopics: string[] = [],
  excludedTopics: Set<string> = new Set()
) {
  const learnedSet = new Set(learnedVocabularyIds)
  const unlearned = vocabulary.filter((item) => !learnedSet.has(item.id))
  const eligibleVocabulary = unlearned.filter((item) => !excludedTopics.has(item.topic))
  const vocabularyPool = eligibleVocabulary.length ? eligibleVocabulary : unlearned
  const topicMatched = vocabularyPool.find((item) => preferredTopics.includes(item.topic))

  return {
    item: topicMatched ?? vocabularyPool[0],
    matchedPreferredTopic: Boolean(topicMatched),
  }
}

type BaseRecommendation = Omit<
  Recommendation,
  "action" | "expectedOutcome" | "riskScore" | "masteryScore" | "learningState" | "evidence"
>

function enrichRecommendation(
  recommendation: BaseRecommendation,
  {
    quizMastery,
    daysFromLatestActivity,
    reviewCount,
    quizAttempts,
  }: {
    quizMastery: number
    daysFromLatestActivity: number
    reviewCount: number
    quizAttempts: number
  }
): Recommendation {
  const masteryScore = clampPriority(quizMastery * 100)
  const factorRisk = recommendation.explanation.factors.reduce(
    (total, factor) => total + Math.max(0, factor.contribution),
    0
  )
  const riskScore = clampPriority(
    Math.max(
      100 - masteryScore,
      Math.min(100, daysFromLatestActivity * 10),
      Math.min(100, reviewCount * 8),
      factorRisk * 0.75
    )
  )
  const isColdStart = recommendation.id.startsWith("onboarding-") || recommendation.id.startsWith("placement-")
  const learningState = isColdStart
    ? "cold-start"
    : recommendation.type === "review"
      ? "needs-review"
      : riskScore >= 60
        ? "at-risk"
        : "on-track"
  const action = recommendation.id === "onboarding-create-profile"
    ? "Hoàn tất hồ sơ học tập để hệ thống có mục tiêu, trình độ kana và thời lượng học."
    : recommendation.id === "placement-test-first"
      ? "Làm placement test để xác định điểm bắt đầu và các vùng kiến thức yếu."
      : recommendation.type === "quiz"
      ? "Làm bài kiểm tra được đề xuất và xem lại các câu trả lời sai."
      : recommendation.type === "review"
        ? "Bắt đầu phiên ôn tập ngắn theo nội dung đang được ưu tiên."
        : `Mở bài ${recommendation.type === "grammar" ? "ngữ pháp" : "từ vựng"} được đề xuất và hoàn thành nội dung chính.`
  const expectedOutcome = recommendation.id === "onboarding-create-profile"
    ? "Tạo đủ dữ liệu cold-start để cá nhân hóa lộ trình ban đầu."
    : recommendation.id === "placement-test-first"
      ? "Xác định mức khởi đầu và tạo bằng chứng đầu tiên cho hệ thống gợi ý."
      : recommendation.type === "quiz"
      ? "Kiểm chứng mức độ nắm kiến thức và cập nhật gợi ý tiếp theo bằng kết quả mới."
      : recommendation.type === "review"
        ? "Giảm nguy cơ quên kiến thức và duy trì nhịp học đều đặn."
        : "Thu hẹp phần kiến thức chưa hoàn thành và cải thiện tiến độ N5."

  return {
    ...recommendation,
    action,
    expectedOutcome,
    riskScore,
    masteryScore,
    learningState,
    evidence: [
      ...recommendation.explanation.factors.map(
        (factor) => `${factor.label}: +${Math.round(factor.contribution)} điểm ảnh hưởng`
      ),
      `Số lần làm quiz đã ghi nhận: ${quizAttempts}`,
    ],
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
  const completedVocabularyTopicsToday = new Set(
    activities
      .filter((activity) => isCompletedSessionActivity(activity, "vocabulary_session") && activity.topic)
      .map((activity) => activity.topic as string)
  )
  const completedGrammarSessionActivitiesToday = activities.filter((activity) =>
    isCompletedSessionActivity(activity, "grammar_session")
  )
  const completedGrammarPatternsToday = new Set(
    content.grammar
      .filter((item) =>
        completedGrammarSessionActivitiesToday.some((activity) => activity.content.includes(item.pattern))
      )
      .map((item) => item.pattern)
  )
  const completedVocabularySessionToday = completedVocabularyTopicsToday.size > 0
  const completedGrammarSessionToday = completedGrammarSessionActivitiesToday.length > 0

  const { item: unlearnedVocabulary, matchedPreferredTopic } = pickNextVocabulary(
    content.vocabulary,
    progress.learnedVocabularyIds,
    profile?.preferredTopics,
    completedVocabularyTopicsToday
  )
  const incompleteGrammar = content.grammar.filter((item) => item.status !== "Đã hoàn thành")
  const nextGrammar =
    incompleteGrammar.find((item) => !completedGrammarPatternsToday.has(item.pattern)) ?? incompleteGrammar[0]

  const recommendations: BaseRecommendation[] = []
  const coldStartScore = profile?.coldStartScore ?? 0
  const coldStartBoost = profile?.completedOnboarding && !activities.length
    ? Math.min(35, Math.round(coldStartScore * 0.35))
    : 0

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
      priority: clampPriority(98 + coldStartBoost),
      estimatedTime: "5 phút",
      targetUrl: "/placement-test",
      explanation: buildExplanation([
        { label: "Đã có hồ sơ nhưng chưa có level ban đầu", contribution: 58 },
        { label: "Cần phân loại điểm yếu", contribution: 40 },
      ]),
    })
  }

  if (placement?.completed && placement.recommendedStart === "kana-basics" && !completedVocabularySessionToday) {
    recommendations.push({
      id: "placement-kana-basics",
      type: "vocabulary",
      title: "Bắt đầu với kana và từ vựng nền tảng",
      reason: "Kết quả đầu vào cho thấy kana là điểm cần xử lý trước khi học nhiều từ N5.",
      priority: clampPriority(94 + coldStartBoost),
      estimatedTime: `${Math.min(profile?.dailyMinutes ?? 20, 20)} phút`,
      targetUrl: buildVocabularySessionHref({ kind: "foundation" }),
      explanation: buildExplanation([
        { label: "Placement test yếu kana", contribution: 45 },
        { label: "Mục tiêu xây nền tảng trước", contribution: 35 },
      ]),
    })
  }

  if (placement?.completed && placement.weakAreas.includes("grammar") && !completedGrammarSessionToday) {
    recommendations.push({
      id: "placement-grammar-foundation",
      type: "grammar",
      title: "Củng cố ngữ pháp câu danh từ",
      reason: "Placement test phát hiện ngữ pháp nền tảng còn yếu, nên học lại mẫu câu cơ bản trước.",
      priority: 88,
      estimatedTime: `${Math.min(profile?.dailyMinutes ?? 20, 20)} phút`,
      targetUrl: buildGrammarSessionHref({ kind: "foundation" }),
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
      targetUrl: buildVocabularySessionHref({ kind: "review" }),
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
    const preferredTopicBoost = matchedPreferredTopic ? 12 : 0
    recommendations.push({
      id: "content-next-vocabulary",
      type: "vocabulary",
      title: `Học từ mới: ${unlearnedVocabulary.topic}`,
      reason: matchedPreferredTopic
        ? `Chủ đề "${unlearnedVocabulary.topic}" nằm trong ưu tiên onboarding, bắt đầu với "${unlearnedVocabulary.japanese}" (${unlearnedVocabulary.vietnamese}).`
        : `Bạn còn từ chưa học, bắt đầu với "${unlearnedVocabulary.japanese}" (${unlearnedVocabulary.vietnamese}).`,
      priority: clampPriority(35 + vocabularyGap + preferredTopicBoost),
      estimatedTime: "15 phút",
      targetUrl: buildVocabularySessionHref({ topic: unlearnedVocabulary.topic }),
      explanation: buildExplanation([
        { label: "Tỷ lệ từ vựng chưa học", contribution: Math.round(vocabularyGap) },
        { label: "Có nội dung tiếp theo trong giáo trình", contribution: 15 },
        { label: "Khớp chủ đề ưu tiên onboarding", contribution: preferredTopicBoost },
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
      targetUrl: buildGrammarSessionHref({ grammarId: nextGrammar.id }),
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

  return recommendations
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 6)
    .map((recommendation) =>
      enrichRecommendation(recommendation, {
        quizMastery,
        daysFromLatestActivity,
        reviewCount: progress.reviewVocabularyIds.length,
        quizAttempts: progress.quizAttempts,
      })
    )
}
