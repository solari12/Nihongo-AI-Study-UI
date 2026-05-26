import type { InitialLevel, KanaLevel, LearningGoal } from "@/hooks/use-learner-profile"

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

export const placementQuestions: PlacementQuestion[] = [
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
]

export function evaluatePlacement({
  answers,
  goal,
  kanaLevel,
}: {
  answers: Record<string, string>
  goal: LearningGoal
  kanaLevel: KanaLevel
}) {
  const areaTotals = placementQuestions.reduce<Record<PlacementArea, number>>(
    (totals, question) => ({
      ...totals,
      [question.area]: totals[question.area] + 1,
    }),
    { kana: 0, vocabulary: 0, grammar: 0 }
  )
  const areaScores = placementQuestions.reduce<Record<PlacementArea, number>>(
    (scores, question) => ({
      ...scores,
      [question.area]: scores[question.area] + (answers[question.id] === question.correctAnswer ? 1 : 0),
    }),
    { kana: 0, vocabulary: 0, grammar: 0 }
  )
  const score = Object.values(areaScores).reduce((total, value) => total + value, 0)
  const total = placementQuestions.length
  const percentage = Math.round((score / total) * 100)
  const weakAreas = (Object.keys(areaTotals) as PlacementArea[]).filter((area) => {
    return areaScores[area] / areaTotals[area] < 0.6
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
        : "daily-conversation-basics"

  return {
    score,
    total,
    percentage,
    level,
    weakAreas,
    recommendedStart,
  }
}
