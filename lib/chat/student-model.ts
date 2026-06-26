import { type ActiveChatSource } from "@/lib/chat/active-source"
import { prisma } from "@/lib/prisma"

export type StudentModel = {
  currentLevel: string
  confidenceScore: number
  vocabularyProgress: {
    learned: number
    total: number
    reviewDue: number
    mastered: number
    percent: number
  }
  grammarWeaknesses: string[]
  readingAccuracy: {
    estimate: number | null
    completedCount: number
    openedOrSavedLevels: string[]
    helpRequestCount: number
  }
  quizAverageScore: {
    count: number
    average: number
    latestScore: number | null
    latestTotal: number | null
    latestPercent: number | null
  }
  recentWrongPatterns: string[]
  listeningActivity: {
    audioListenCount: number
    lastListenedAt: string | null
  }
  completedReadings: {
    count: number
    levels: string[]
    latestTitles: string[]
  }
  savedItems: {
    total: number
    vocabularyCount: number
    grammarCount: number
    readingCount: number
    latestTitles: string[]
  }
  studyGoal: string | null
  dailyStudyTime: number | null
  nextRecommendedAction: string
  recommendationReason: string
  dataQuality: "low" | "medium" | "high"
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function percentage(part: number, total: number) {
  return total ? Math.round((part / total) * 100) : 0
}

function uniqueSorted(values: Iterable<string>) {
  return Array.from(new Set(Array.from(values).filter(Boolean))).sort()
}

function parseMetadataValue(content: string, key: string) {
  const match = content.match(new RegExp(`${key}=([^|]+)`))
  return match?.[1]?.trim()
}

function goalLabel(goal: string | null | undefined) {
  if (goal === "JLPT_N5") return "thi JLPT N5"
  if (goal === "COMMUNICATION") return "giao tiếp cơ bản"
  if (goal === "FROM_ZERO") return "bắt đầu từ số 0"
  return null
}

function placementLevelLabel(level: string | null | undefined) {
  if (level === "absolute_beginner") return "N5 mới bắt đầu"
  if (level === "early_n5") return "đầu N5"
  if (level === "n5_review") return "N5 đang ôn lại"
  return null
}

function inferCurrentLevel({
  placementLevel,
  averageQuizScore,
  learnedVocabulary,
  articleLevels,
}: {
  placementLevel?: string | null
  averageQuizScore: number
  learnedVocabulary: number
  articleLevels: Set<string>
}) {
  if (placementLevel === "absolute_beginner") return "N5 mới bắt đầu"
  if (placementLevel === "early_n5") return "đầu N5"
  if (placementLevel === "n5_review" && (averageQuizScore >= 80 || articleLevels.has("N4") || articleLevels.has("N3"))) {
    return "N5 vững / chạm đầu N4"
  }
  if ((articleLevels.has("N4") || articleLevels.has("N3")) && averageQuizScore >= 70) return "đầu N4"
  if (averageQuizScore >= 85 && learnedVocabulary >= 80) return "N5 khá vững"
  if (averageQuizScore >= 60 || learnedVocabulary >= 30 || placementLevel) return "N5"
  return "N5/đầu N5"
}

function buildWrongPatterns(quizAttempts: Array<{ percentage: number; quizType: string }>, activityTexts: string[]) {
  const patterns = new Set<string>()
  const latestLowQuiz = quizAttempts.find((attempt) => attempt.percentage < 60)

  if (latestLowQuiz) {
    patterns.add(latestLowQuiz.quizType === "grammar" ? "ngữ pháp trong quiz còn yếu" : "từ vựng trong quiz còn chưa chắc")
  }

  for (const text of activityTexts.slice(0, 20)) {
    const normalized = normalize(text)
    if (normalized.includes("tro tu") || normalized.includes("particle")) patterns.add("trợ từ")
    if (normalized.includes("ngu phap")) patterns.add("ngữ pháp nền tảng")
    if (normalized.includes("tu vung")) patterns.add("từ vựng")
    if (normalized.includes("doc hieu") || normalized.includes("reading")) patterns.add("đọc hiểu")
  }

  return Array.from(patterns).slice(0, 4)
}

function inferReadingAccuracy({
  completedCount,
  helpRequestCount,
  averageQuizScore,
}: {
  completedCount: number
  helpRequestCount: number
  averageQuizScore: number
}) {
  if (!completedCount) return null
  const base = averageQuizScore || 65
  const helpPenalty = Math.min(20, helpRequestCount * 4)
  return Math.max(35, Math.min(95, base - helpPenalty))
}

function nextActionFor(model: Omit<StudentModel, "nextRecommendedAction" | "recommendationReason">) {
  const latest = model.quizAverageScore.latestPercent

  if (!model.listeningActivity.audioListenCount) {
    return {
      action: "Nghe audio của bài đọc gần nhất rồi hỏi Kami 2-3 câu chưa hiểu.",
      reason: "Phần nghe chưa có nhiều dữ liệu, nên cần bổ sung trước khi đánh giá toàn diện hơn.",
    }
  }

  if (latest !== null && latest >= 80) {
    return {
      action: "Làm một quiz N5/N4 ngắn hoặc thử một bài đọc N4 nhẹ.",
      reason: "Điểm quiz gần đây tốt, có thể kiểm tra xem bạn đã sẵn sàng chạm lên mức khó hơn chưa.",
    }
  }

  if (latest !== null && latest < 50) {
    return {
      action: "Ôn lại từ vựng/ngữ pháp liên quan đến các câu sai rồi làm lại quiz ngắn.",
      reason: "Điểm quiz dưới 50% thường cho thấy nên vá nền trước khi học nội dung mới.",
    }
  }

  if (model.readingAccuracy.estimate !== null && model.readingAccuracy.estimate < 60) {
    return {
      action: "Đọc một bài N5 ngắn hơn, sau đó tạo quiz đọc hiểu từ chính bài đó.",
      reason: "Dữ liệu đọc hiểu đang yếu, nên giảm độ dài bài và kiểm tra từng bước.",
    }
  }

  if (model.dailyStudyTime && model.dailyStudyTime >= 30) {
    return {
      action: "Đi theo nhịp tuần: 3 buổi từ vựng, 2 buổi ngữ pháp, 1 buổi đọc, 1 buổi quiz tổng hợp.",
      reason: "Nhịp học 30 phút/ngày đủ ổn để chia tuần rõ ràng thay vì học ngẫu hứng.",
    }
  }

  return {
    action: "Làm một quiz N5 ngắn, đọc một bài N5 nhẹ và lưu các từ bạn muốn ôn lại.",
    reason: "Đây là bước cân bằng nhất để Kami có thêm dữ liệu quiz, đọc hiểu và mục ôn tập.",
  }
}

export async function buildStudentModel(userId: string, activeSource?: ActiveChatSource | null): Promise<StudentModel> {
  const [
    vocabularyProgress,
    vocabularyTotal,
    quizAttempts,
    activities,
    savedItems,
    profile,
    placement,
    chatLogs,
    articles,
  ] = await Promise.all([
    prisma.userVocabularyProgress.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 500,
    }),
    prisma.vocabulary.count(),
    prisma.quizAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 120,
    }),
    prisma.savedStudyItem.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    prisma.learnerProfile.findUnique({ where: { userId } }),
    prisma.placementResult.findUnique({ where: { userId } }),
    prisma.chatLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    prisma.newsArticle.findMany({
      select: { id: true, title: true, level: true },
      take: 300,
    }),
  ])

  const now = new Date()
  const mastered = vocabularyProgress.filter((item) => item.stage === "mastered").length
  const reviewDue = vocabularyProgress.filter((item) => item.dueAt <= now).length
  const averageQuizScore = quizAttempts.length
    ? Math.round(quizAttempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / quizAttempts.length)
    : 0
  const latestQuiz = quizAttempts[0] ?? null
  const articleById = new Map(articles.map((article) => [article.id, article]))
  const articleByTitle = new Map(articles.map((article) => [normalize(article.title), article]))
  const articleLevels = new Set<string>()
  const completedReadingTitles = new Set<string>()

  if (activeSource?.type === "news") {
    const article = articleById.get(activeSource.id)
    if (article?.level) articleLevels.add(article.level)
  }

  for (const item of savedItems) {
    const matchedArticle =
      articleById.get(item.sourceId) ??
      articleById.get(item.itemKey) ??
      articleByTitle.get(normalize(item.title))
    if (matchedArticle?.level) articleLevels.add(matchedArticle.level)
  }

  const readingActivities = activities.filter((activity) => {
    const text = normalize(`${activity.type} ${activity.content} ${activity.topic ?? ""}`)
    return text.includes("reading") || text.includes("bai doc") || text.includes("bai bao") || text.includes("todaii")
  })
  const completedReadingActivities = readingActivities.filter((activity) => {
    const text = normalize(`${activity.type} ${activity.content} ${activity.result ?? ""}`)
    return text.includes("completed") || text.includes("hoan thanh") || activity.type === "reading"
  })

  for (const activity of readingActivities) {
    const matchedArticle = articles.find((article) => normalize(`${activity.content} ${activity.topic ?? ""}`).includes(normalize(article.title)))
    if (matchedArticle?.level) articleLevels.add(matchedArticle.level)
    if (matchedArticle?.title) completedReadingTitles.add(matchedArticle.title)
    if (/^N[1-5]$/.test(activity.topic ?? "")) articleLevels.add(activity.topic as string)
  }

  const audioActivities = activities.filter((activity) => {
    const text = normalize(`${activity.type} ${activity.content} ${activity.result ?? ""}`)
    return text.includes("audio") || text.includes("nghe") || activity.type === "reading_audio"
  })
  const readingHelpCount = chatLogs.filter((log) => {
    const text = normalize(`${log.message} ${log.answer}`)
    return (
      text.includes("bai nay") ||
      text.includes("trong bai") ||
      text.includes("bai doc") ||
      text.includes("doc hieu") ||
      text.includes("todaii")
    )
  }).length
  const activityTexts = activities.map((activity) => `${activity.type} ${activity.content} ${activity.topic ?? ""} ${activity.result ?? ""}`)
  const grammarWeaknesses = uniqueSorted([
    ...(placement?.weakAreas && Array.isArray(placement.weakAreas)
      ? placement.weakAreas.filter((area): area is string => typeof area === "string" && normalize(area).includes("grammar"))
      : []),
    ...buildWrongPatterns(quizAttempts, activityTexts).filter((pattern) => pattern.includes("ngữ pháp") || pattern.includes("trợ từ")),
  ])
  const dataSignals = [
    Boolean(placement),
    quizAttempts.length > 0,
    vocabularyProgress.length > 0,
    readingActivities.length > 0 || articleLevels.size > 0,
    savedItems.length > 0,
    audioActivities.length > 0,
    readingHelpCount > 0,
  ].filter(Boolean).length
  const baseModel = {
    currentLevel: inferCurrentLevel({
      placementLevel: placement?.level,
      averageQuizScore,
      learnedVocabulary: vocabularyProgress.length,
      articleLevels,
    }),
    confidenceScore: Math.min(95, Math.max(25, dataSignals * 13 + (quizAttempts.length ? 10 : 0) + (placement ? 12 : 0))),
    vocabularyProgress: {
      learned: vocabularyProgress.length,
      total: vocabularyTotal,
      reviewDue,
      mastered,
      percent: percentage(vocabularyProgress.length, vocabularyTotal),
    },
    grammarWeaknesses: grammarWeaknesses.length ? grammarWeaknesses : ["chưa đủ dữ liệu để chỉ ra điểm yếu ngữ pháp cụ thể"],
    readingAccuracy: {
      estimate: inferReadingAccuracy({
        completedCount: completedReadingActivities.length,
        helpRequestCount: readingHelpCount,
        averageQuizScore,
      }),
      completedCount: completedReadingActivities.length,
      openedOrSavedLevels: uniqueSorted(articleLevels),
      helpRequestCount: readingHelpCount,
    },
    quizAverageScore: {
      count: quizAttempts.length,
      average: averageQuizScore,
      latestScore: latestQuiz?.score ?? null,
      latestTotal: latestQuiz?.total ?? null,
      latestPercent: latestQuiz?.percentage ?? null,
    },
    recentWrongPatterns: buildWrongPatterns(quizAttempts, activityTexts),
    listeningActivity: {
      audioListenCount: audioActivities.length,
      lastListenedAt: audioActivities[0]?.createdAt.toISOString() ?? null,
    },
    completedReadings: {
      count: completedReadingActivities.length,
      levels: uniqueSorted(articleLevels),
      latestTitles: Array.from(completedReadingTitles).slice(0, 3),
    },
    savedItems: {
      total: savedItems.length,
      vocabularyCount: savedItems.filter((item) => item.type === "vocabulary" && item.level !== "reading").length,
      grammarCount: savedItems.filter((item) => item.type === "grammar").length,
      readingCount: savedItems.filter((item) => item.level === "reading" || item.sourceType.includes("news")).length,
      latestTitles: savedItems.slice(0, 5).map((item) => item.title),
    },
    studyGoal: goalLabel(profile?.goal),
    dailyStudyTime: profile?.dailyMinutes ?? null,
    dataQuality: dataSignals >= 5 ? "high" as const : dataSignals >= 3 ? "medium" as const : "low" as const,
  }
  const next = nextActionFor(baseModel)

  return {
    ...baseModel,
    nextRecommendedAction: next.action,
    recommendationReason: next.reason,
  }
}

export function buildStudentModelPromptContext(model: StudentModel) {
  return [
    "Student Model snapshot:",
    `- currentLevel: ${model.currentLevel}`,
    `- confidenceScore: ${model.confidenceScore}/100 (${model.dataQuality})`,
    `- vocabularyProgress: ${model.vocabularyProgress.learned}/${model.vocabularyProgress.total}, reviewDue=${model.vocabularyProgress.reviewDue}, mastered=${model.vocabularyProgress.mastered}`,
    `- grammarWeaknesses: ${model.grammarWeaknesses.join(", ")}`,
    `- readingAccuracy: ${model.readingAccuracy.estimate ?? "unknown"}; completed=${model.readingAccuracy.completedCount}; levels=${model.readingAccuracy.openedOrSavedLevels.join(", ") || "none"}; helpRequests=${model.readingAccuracy.helpRequestCount}`,
    `- quizAverageScore: count=${model.quizAverageScore.count}; average=${model.quizAverageScore.average}; latest=${model.quizAverageScore.latestPercent ?? "none"}`,
    `- recentWrongPatterns: ${model.recentWrongPatterns.join(", ") || "none"}`,
    `- listeningActivity: ${model.listeningActivity.audioListenCount}`,
    `- savedItems: total=${model.savedItems.total}; readings=${model.savedItems.readingCount}; vocabulary=${model.savedItems.vocabularyCount}; grammar=${model.savedItems.grammarCount}`,
    `- studyGoal: ${model.studyGoal ?? "unknown"}; dailyStudyTime=${model.dailyStudyTime ?? "unknown"}`,
    `- nextRecommendedAction: ${model.nextRecommendedAction}`,
    "Instruction: Use this as a learning coach snapshot. Do not output it as raw dashboard data; turn it into friendly study feedback.",
  ].join("\n")
}

export function buildStudentLevelAssessmentAnswer(model: StudentModel) {
  const confidence =
    model.dataQuality === "high"
      ? "Đánh giá này khá có cơ sở."
      : model.dataQuality === "medium"
        ? "Đây là đánh giá sơ bộ."
        : "Đây là đánh giá tạm thời vì dữ liệu còn ít."
  const observations: string[] = []

  if (model.quizAverageScore.count) {
    observations.push(
      `Điểm quiz của bạn đang ở mức ${model.quizAverageScore.average >= 80 ? "khá tốt" : model.quizAverageScore.average >= 60 ? "ổn nhưng cần củng cố thêm" : "cần ôn lại kỹ hơn"}; lần gần nhất đạt ${model.quizAverageScore.latestPercent}%.`
    )
  } else {
    observations.push("Kami chưa có nhiều kết quả quiz, nên phần từ vựng/ngữ pháp vẫn cần một bài kiểm tra ngắn để chắc hơn.")
  }

  if (model.vocabularyProgress.learned) {
    observations.push("Bạn đã bắt đầu tích lũy từ vựng trong app, đây là tín hiệu tốt cho nền N5 nếu duy trì ôn đều.")
  } else {
    observations.push("Phần từ vựng trong app chưa có nhiều dấu vết học, nên Kami chưa đo chắc vốn từ hiện tại của bạn.")
  }

  if (model.completedReadings.count) {
    observations.push(
      `Bạn đã có tương tác với bài đọc${model.completedReadings.levels.length ? ` ở mức ${model.completedReadings.levels.join(", ")}` : ""}, nên Kami có thêm dữ liệu đọc hiểu.`
    )
  } else {
    observations.push("Hệ thống chưa ghi nhận bài đọc hoàn thành, nên Kami cần thêm dữ liệu đọc hiểu để đánh giá chắc hơn.")
  }

  if (model.listeningActivity.audioListenCount) {
    observations.push("Bạn đã có dữ liệu nghe audio, giúp Kami nhìn thêm một chút về kỹ năng nghe.")
  } else {
    observations.push("Bạn chưa có nhiều dữ liệu luyện nghe, nên phần nghe cần được kiểm tra thêm.")
  }

  return [
    `Dựa trên dữ liệu học gần đây, mình đánh giá bạn đang ở khoảng **${model.currentLevel}**. ${confidence}`,
    "",
    observations.join(" "),
    "",
    model.currentLevel.includes("N4")
      ? "Bạn đang đi đúng hướng, nhưng Kami vẫn cần thêm dữ liệu đọc hiểu và nghe để kết luận bạn đã vững N5 hay mới chạm đầu N4."
      : "Bạn đang đi đúng hướng ở vùng N5, nhưng Kami cần thêm quiz và bài đọc để biết bạn đang ở đầu N5 hay đã khá vững.",
    "",
    `Bước tiếp theo phù hợp nhất: ${model.nextRecommendedAction} ${model.recommendationReason}`,
  ].join("\n")
}

export function buildStudentNextActionAnswer(model: StudentModel) {
  const confidenceLabel =
    model.confidenceScore >= 80 ? "cao" : model.confidenceScore >= 65 ? "khá tốt" : model.confidenceScore >= 45 ? "vừa" : "thấp"
  const contextLine = model.completedReadings.count
    ? "Kami sẽ dựa trên bài đọc gần đây và dữ liệu học của bạn để xếp nhịp hôm nay."
    : "Hiện bạn chưa chọn bài đọc cụ thể, nên Kami sẽ dựa trên dữ liệu học gần đây để gợi ý."
  const quizTask = model.quizAverageScore.latestPercent !== null && model.quizAverageScore.latestPercent < 50
    ? "Làm lại một quiz N5 ngắn, ưu tiên phần vừa sai."
    : model.quizAverageScore.latestPercent !== null && model.quizAverageScore.latestPercent >= 80
      ? "Làm một quiz N5/N4 ngắn để thử tăng nhẹ độ khó."
      : "Làm một quiz N5 ngắn để kiểm tra lại phần vừa học."
  const readingTask = model.completedReadings.latestTitles[0]
    ? `Đọc lại bài **${model.completedReadings.latestTitles[0]}** hoặc một bài N5 nhẹ.`
    : "Đọc một bài N5 nhẹ, ưu tiên chủ đề đời sống dễ theo."
  const audioTask = model.listeningActivity.audioListenCount
    ? "Nghe lại audio bài gần nhất và chú ý các câu nghe chưa rõ."
    : "Nghe audio của bài đọc vừa chọn để Kami có thêm dữ liệu phần nghe."

  return [
    `Hôm nay bạn nên học theo một phiên **30 phút**. Mức chắc chắn của gợi ý hiện ở mức **${confidenceLabel}**, dựa trên quiz, bài đọc, mục đã lưu và dữ liệu nghe gần đây.`,
    "",
    contextLine,
    "",
    "**Kế hoạch 30 phút:**",
    `1. 5 phút: ${readingTask}`,
    `2. 10 phút: ${audioTask}`,
    `3. 10 phút: ${quizTask}`,
    "4. 5 phút: hỏi Kami phần chưa hiểu và lưu lại 2-3 mục cần ôn.",
    "",
    `Lý do: ${model.recommendationReason}`,
    model.dailyStudyTime
      ? `Nhịp hồ sơ của bạn là ${model.dailyStudyTime} phút/ngày, nên phiên 30 phút này vừa đủ để học, kiểm tra và chốt phần cần ôn.`
      : "Nếu bạn cập nhật thời gian học mỗi ngày trong hồ sơ, Kami sẽ chia nhịp học sát hơn.",
  ].join("\n")
}

export function buildProjectGodModeAnswer(
  model: StudentModel,
  counts: { vocabulary: number; grammar: number; quiz: number; reading: number },
  page: string,
  activeSourceTitle?: string | null
) {
  const confidenceLabel =
    model.confidenceScore >= 80 ? "cao" : model.confidenceScore >= 65 ? "khá tốt" : model.confidenceScore >= 45 ? "vừa" : "thấp"
  const sourceContext = activeSourceTitle
    ? `Hiện Kami đang bám theo bài/nguồn **${activeSourceTitle}** khi bạn hỏi về nội dung đang học.`
    : "Hiện bạn chưa chọn bài đọc cụ thể, nên Kami sẽ dựa trên dữ liệu học gần đây để gợi ý."

  return [
    "Có, Kami đang được nâng thành trung tâm điều phối học trong project, nhưng vẫn nói đúng theo quyền thật của hệ thống.",
    "",
    "Hiện Kami có thể:",
    `- Hỏi đáp từ vựng, ngữ pháp và bài đọc dựa trên kho dữ liệu: ${counts.vocabulary} từ vựng, ${counts.grammar} mẫu ngữ pháp, ${counts.quiz} câu quiz, ${counts.reading} bài đọc.`,
    "- Dùng bài đang mở hoặc nguồn vừa truy xuất để giải thích, tóm tắt, rút từ vựng/ngữ pháp và tạo quiz đúng ngữ cảnh.",
    "- Tạo quiz, chấm quiz, giải thích đáp án và dùng kết quả đã lưu để cập nhật hồ sơ học của bạn.",
    "- Đánh giá trình độ sơ bộ như một coach, không chỉ báo raw data.",
    "- Gợi ý bước học tiếp theo dựa trên quiz, bài đọc, audio, mục đã lưu, mục tiêu và thời gian học.",
    "- Nối vòng học khép kín: học bài -> hỏi Kami -> tạo quiz -> nộp bài -> lưu lịch sử -> cập nhật hồ sơ học -> gợi ý bài kế tiếp.",
    "",
    "Giới hạn hiện tại:",
    "- Kami chưa tự sửa dữ liệu admin hoặc thay đổi nội dung gốc nếu không có quyền/xác nhận rõ ràng.",
    "- Nếu dữ liệu đọc/nghe/quiz còn ít, đánh giá trình độ sẽ là tạm thời chứ không khẳng định quá mức.",
    "",
    `Với dữ liệu học hiện có, Kami đang ước lượng bạn ở khoảng **${model.currentLevel}**. Mức chắc chắn hiện là **${confidenceLabel}** vì dựa trên quiz, bài đọc, nghe audio và mục đã lưu gần đây.`,
    `Gợi ý tiếp theo: ${model.nextRecommendedAction}`,
    sourceContext,
  ].join("\n")
}
