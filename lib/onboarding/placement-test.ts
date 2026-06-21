import type { ExperienceLevel, InitialLevel, KanaLevel, LearningGoal } from "@/hooks/use-learner-profile"

export type PlacementArea = "kana" | "vocabulary" | "grammar"

export type PlacementQuestion = {
  id: string
  area: PlacementArea
  question: string
  answers: {
    id: string
    text: string
  }[]
  correctAnswer: string
  explanation: string
}

type PlacementProfileInput = {
  goal: LearningGoal
  kanaLevel: KanaLevel
  experience: ExperienceLevel
  guideCompletedSteps: string[]
}

const basicKanaQuestions: PlacementQuestion[] = [
  {
    id: "kana-a",
    area: "kana",
    question: "Chữ あ đọc là gì?",
    answers: [
      { id: "a", text: "a" },
      { id: "b", text: "i" },
      { id: "c", text: "u" },
      { id: "d", text: "e" },
    ],
    correctAnswer: "a",
    explanation: "あ là hiragana đọc là a.",
  },
  {
    id: "kana-ka",
    area: "kana",
    question: "Chữ か đọc là gì?",
    answers: [
      { id: "a", text: "sa" },
      { id: "b", text: "ka" },
      { id: "c", text: "ta" },
      { id: "d", text: "na" },
    ],
    correctAnswer: "b",
    explanation: "か là hiragana đọc là ka.",
  },
]

const kanaSpeedQuestions: PlacementQuestion[] = [
  {
    id: "kana-tsu",
    area: "kana",
    question: "Chữ つ đọc là gì?",
    answers: [
      { id: "a", text: "su" },
      { id: "b", text: "tsu" },
      { id: "c", text: "shi" },
      { id: "d", text: "chi" },
    ],
    correctAnswer: "b",
    explanation: "つ là hiragana đọc là tsu.",
  },
  {
    id: "katakana-so",
    area: "kana",
    question: "Chữ ソ đọc là gì?",
    answers: [
      { id: "a", text: "so" },
      { id: "b", text: "n" },
      { id: "c", text: "shi" },
      { id: "d", text: "ri" },
    ],
    correctAnswer: "a",
    explanation: "ソ là katakana đọc là so.",
  },
]

const n5VocabularyQuestions: PlacementQuestion[] = [
  {
    id: "vocab-gakusei",
    area: "vocabulary",
    question: "学生 nghĩa là gì?",
    answers: [
      { id: "a", text: "Giáo viên" },
      { id: "b", text: "Bác sĩ" },
      { id: "c", text: "Học sinh / sinh viên" },
      { id: "d", text: "Công ty" },
    ],
    correctAnswer: "c",
    explanation: "学生（がくせい）nghĩa là học sinh hoặc sinh viên.",
  },
  {
    id: "vocab-denwa",
    area: "vocabulary",
    question: "電話 nghĩa là gì?",
    answers: [
      { id: "a", text: "Điện thoại" },
      { id: "b", text: "Xe đạp" },
      { id: "c", text: "Trường học" },
      { id: "d", text: "Nước" },
    ],
    correctAnswer: "a",
    explanation: "電話（でんわ）nghĩa là điện thoại.",
  },
  {
    id: "vocab-mainichi",
    area: "vocabulary",
    question: "毎日 nghĩa là gì?",
    answers: [
      { id: "a", text: "Hôm qua" },
      { id: "b", text: "Mỗi ngày" },
      { id: "c", text: "Tuần sau" },
      { id: "d", text: "Buổi sáng" },
    ],
    correctAnswer: "b",
    explanation: "毎日（まいにち）nghĩa là mỗi ngày.",
  },
]

const communicationVocabularyQuestions: PlacementQuestion[] = [
  {
    id: "vocab-ohayou",
    area: "vocabulary",
    question: "おはようございます dùng khi nào?",
    answers: [
      { id: "a", text: "Chào buổi sáng" },
      { id: "b", text: "Chúc ngủ ngon" },
      { id: "c", text: "Xin lỗi" },
      { id: "d", text: "Cảm ơn" },
    ],
    correctAnswer: "a",
    explanation: "おはようございます là cách chào buổi sáng lịch sự.",
  },
  {
    id: "vocab-arigatou",
    area: "vocabulary",
    question: "ありがとうございます nghĩa là gì?",
    answers: [
      { id: "a", text: "Không sao" },
      { id: "b", text: "Xin chào" },
      { id: "c", text: "Cảm ơn" },
      { id: "d", text: "Tạm biệt" },
    ],
    correctAnswer: "c",
    explanation: "ありがとうございます nghĩa là cảm ơn.",
  },
]

const grammarQuestions: PlacementQuestion[] = [
  {
    id: "grammar-desu",
    area: "grammar",
    question: "私は学生です。nghĩa là gì?",
    answers: [
      { id: "a", text: "Tôi không phải sinh viên." },
      { id: "b", text: "Tôi là sinh viên." },
      { id: "c", text: "Bạn là sinh viên." },
      { id: "d", text: "Đây là sinh viên." },
    ],
    correctAnswer: "b",
    explanation: "Mẫu N は N です dùng để nói A là B.",
  },
  {
    id: "grammar-question",
    area: "grammar",
    question: "Câu 私は学生です。đổi sang câu hỏi tự nhiên nhất là gì?",
    answers: [
      { id: "a", text: "私は学生ですか。" },
      { id: "b", text: "私は学生でした。" },
      { id: "c", text: "私は学生じゃありません。" },
      { id: "d", text: "私は学生のです。" },
    ],
    correctAnswer: "a",
    explanation: "Thêm か cuối câu để tạo câu hỏi lịch sự.",
  },
  {
    id: "grammar-particle-ni",
    area: "grammar",
    question: "Trong câu 7時に起きます, に dùng để làm gì?",
    answers: [
      { id: "a", text: "Đánh dấu thời điểm" },
      { id: "b", text: "Đánh dấu chủ đề" },
      { id: "c", text: "Nối hai danh từ" },
      { id: "d", text: "Phủ định động từ" },
    ],
    correctAnswer: "a",
    explanation: "に có thể đánh dấu thời điểm xảy ra hành động.",
  },
]

export const placementQuestions = [
  ...basicKanaQuestions,
  ...n5VocabularyQuestions.slice(0, 2),
  ...grammarQuestions.slice(0, 2),
]

function getMetadataValue(items: string[], prefix: string, fallback: string) {
  const entry = items.find((item) => item.startsWith(prefix))
  return entry ? entry.slice(prefix.length) : fallback
}

function uniqueQuestions(questions: PlacementQuestion[]) {
  const seen = new Set<string>()
  return questions.filter((question) => {
    if (seen.has(question.id)) return false
    seen.add(question.id)
    return true
  })
}

export function buildPlacementQuestions(profile: PlacementProfileInput) {
  const kanaRetention = getMetadataValue(profile.guideCompletedSteps, "profile:kanaRetention:", "unknown")
  const isReview = profile.experience === "returning" || profile.guideCompletedSteps.includes("profile:planType:review")
  const needsBasicKana =
    profile.kanaLevel === "none" ||
    kanaRetention === "none" ||
    kanaRetention === "low" ||
    profile.guideCompletedSteps.includes("profile:needsPlacement:true")

  const kanaSet = needsBasicKana ? basicKanaQuestions : kanaSpeedQuestions
  const vocabularySet = profile.goal === "COMMUNICATION" ? communicationVocabularyQuestions : n5VocabularyQuestions
  const grammarSet = isReview ? grammarQuestions : grammarQuestions.slice(0, 2)

  if (profile.goal === "FROM_ZERO" && needsBasicKana) {
    return uniqueQuestions([...basicKanaQuestions, vocabularySet[0], grammarSet[0]]).slice(0, 4)
  }

  if (profile.goal === "COMMUNICATION") {
    return uniqueQuestions([kanaSet[0], ...communicationVocabularyQuestions, grammarSet[0], grammarSet[1]]).slice(0, 5)
  }

  if (isReview) {
    return uniqueQuestions([...kanaSet, ...n5VocabularyQuestions, ...grammarQuestions]).slice(0, 6)
  }

  return uniqueQuestions([...kanaSet, ...n5VocabularyQuestions, ...grammarSet]).slice(0, 6)
}

export function describePlacementContext(profile: PlacementProfileInput) {
  const kanaRetention = getMetadataValue(profile.guideCompletedSteps, "profile:kanaRetention:", "unknown")
  const isReview = profile.experience === "returning" || profile.guideCompletedSteps.includes("profile:planType:review")

  if (isReview) {
    return "Bài test này ưu tiên tìm phần bạn đã quên sau thời gian nghỉ, rồi mới chốt lộ trình ôn lại."
  }

  if (profile.goal === "JLPT_N5") {
    return "Bài test này ưu tiên kana, từ vựng N5 và ngữ pháp N5 để xác định điểm bắt đầu cho mục tiêu JLPT."
  }

  if (profile.goal === "COMMUNICATION") {
    return "Bài test này ưu tiên câu chào hỏi, từ vựng giao tiếp và mẫu câu thực dụng."
  }

  if (profile.kanaLevel === "none" || kanaRetention === "none") {
    return "Vì bạn chọn bắt đầu từ nền tảng, bài test chỉ kiểm tra rất nhẹ để xem có thể học kana từ đâu."
  }

  return "Bài test này dùng lựa chọn ở bước trước để kiểm tra nhanh phần nền tảng phù hợp."
}

export function evaluatePlacement({
  answers,
  goal,
  kanaLevel,
  questions,
}: {
  answers: Record<string, string>
  goal: LearningGoal
  kanaLevel: KanaLevel
  questions?: PlacementQuestion[]
}) {
  const activeQuestions = questions?.length ? questions : placementQuestions
  const areaTotals = activeQuestions.reduce<Record<PlacementArea, number>>(
    (totals, question) => ({
      ...totals,
      [question.area]: totals[question.area] + 1,
    }),
    { kana: 0, vocabulary: 0, grammar: 0 }
  )
  const areaScores = activeQuestions.reduce<Record<PlacementArea, number>>(
    (scores, question) => ({
      ...scores,
      [question.area]: scores[question.area] + (answers[question.id] === question.correctAnswer ? 1 : 0),
    }),
    { kana: 0, vocabulary: 0, grammar: 0 }
  )
  const score = Object.values(areaScores).reduce((total, value) => total + value, 0)
  const total = activeQuestions.length
  const percentage = Math.round((score / total) * 100)
  const weakAreas = (Object.keys(areaTotals) as PlacementArea[]).filter((area) => {
    return areaTotals[area] > 0 && areaScores[area] / areaTotals[area] < 0.6
  })

  let level: InitialLevel = "absolute_beginner"
  if (percentage >= 80 && weakAreas.length <= 1) {
    level = "n5_review"
  } else if (percentage >= 50) {
    level = "early_n5"
  }

  const recommendedStart =
    kanaLevel === "none" || weakAreas.includes("kana")
      ? "kana-basics"
      : goal === "JLPT_N5"
        ? "n5-core-vocabulary"
        : goal === "COMMUNICATION"
          ? "daily-conversation-basics"
          : weakAreas.includes("grammar")
            ? "n5-basic-grammar"
            : "n5-core-vocabulary"

  return {
    score,
    total,
    percentage,
    level,
    weakAreas,
    recommendedStart,
  }
}
