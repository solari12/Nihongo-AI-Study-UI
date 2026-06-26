"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  AlertTriangle,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Clock,
  Compass,
  GraduationCap,
  Languages,
  ListChecks,
  RefreshCw,
  Save,
  Sparkles,
  Target,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import {
  type ExperienceLevel,
  type KanaLevel,
  type LearningGoal,
  useLearnerProfile,
} from "@/hooks/use-learner-profile"

type PlanGoal = LearningGoal | "REVIEW"
type PlanType = "standard" | "review"
type KanaChoice = "none" | "hiragana_low" | "both_medium" | "both_high" | "unknown"
type JlptDeadline = "3_months" | "6_months" | "12_months" | "unsure"

interface LearningPlanPreview {
  startPoint: string
  paceLabel: string
  goalLabel: string
  warning?: string
  needsCheck?: string
  stages: string[]
  topicNote?: string
  nextRoute: "/placement-test" | "/dashboard" | "/learning-path"
}

const fallbackTopicLabels = [
  "Chào hỏi",
  "Gia đình",
  "Trường học",
  "Thời gian",
  "Đồ vật",
  "Động từ",
  "Tính từ",
  "Đồ ăn",
  "Địa điểm",
  "Di chuyển",
  "Người & nghề nghiệp",
  "Cơ thể & sức khỏe",
  "Màu sắc",
  "Thiên nhiên",
  "Công việc",
  "Du lịch",
  "Mua sắm",
  "Số đếm",
]

const topicIconMap: Record<string, string> = {
  "Chào hỏi": "👋",
  "Gia đình": "🏠",
  "Trường học": "🏫",
  "Công việc": "💼",
  "Du lịch": "🧳",
  "Đồ ăn": "🍱",
  "Ăn uống": "🍱",
  "Mua sắm": "🛍️",
  "Số đếm": "🔢",
  "Thời gian": "🕒",
  "Đồ vật": "📦",
  "Động từ": "🏃",
  "Tính từ": "✨",
  "Địa điểm": "📍",
  "Di chuyển": "🚃",
  "Người & nghề nghiệp": "👥",
  "Cơ thể & sức khỏe": "🩺",
  "Màu sắc": "🎨",
  "Thiên nhiên": "🌿",
  "JLPT N5": "🎯",
}

const fallbackTopicOptions = fallbackTopicLabels.map((label) => ({
  label,
  icon: topicIconMap[label] ?? "🏷️",
}))

type VocabularyTopicsResponse = {
  topics?: string[]
}

function normalizeTopicOptions(topics: string[]) {
  const labels = topics
    .map((topic) => topic.trim())
    .filter((topic) => topic && topic !== "Tất cả")

  return Array.from(new Set(labels)).map((label) => ({
    label,
    icon: topicIconMap[label] ?? "🏷️",
  }))
}

const dailyMinuteOptions = [15, 30, 45, 60]

const paperCardStyle = {
  backgroundColor: "transparent",
  backgroundImage: "url('/assets/paper-card-bg-clean.png')",
  backgroundRepeat: "no-repeat",
  backgroundSize: "100% 100%",
  backgroundPosition: "center",
} as const

const goalOptions: {
  value: PlanGoal
  label: string
  badge: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  {
    value: "FROM_ZERO",
    label: "Bắt đầu từ số 0",
    badge: "Người mới",
    description: "Đi từ hiragana, katakana, từ vựng nền tảng và mẫu câu rất cơ bản.",
    icon: Sparkles,
  },
  {
    value: "JLPT_N5",
    label: "Thi JLPT N5",
    badge: "Thi cử",
    description: "Ưu tiên từ vựng N5, ngữ pháp N5, kanji N5 và đọc hiểu cơ bản.",
    icon: GraduationCap,
  },
  {
    value: "COMMUNICATION",
    label: "Giao tiếp cơ bản",
    badge: "Thực dụng",
    description: "Tập trung chào hỏi, tình huống hằng ngày và câu mẫu dễ dùng.",
    icon: Compass,
  },
  {
    value: "REVIEW",
    label: "Ôn lại kiến thức cũ",
    badge: "Quay lại",
    description: "Bắt đầu bằng kiểm tra lỗ hổng rồi nối tiếp phần bạn còn yếu.",
    icon: RefreshCw,
  },
]

const kanaOptions: {
  value: KanaChoice
  label: string
  description: string
  kanaLevel: KanaLevel | "keep"
  retention: "none" | "low" | "medium" | "high" | "unknown"
  needsPlacement?: boolean
}[] = [
  {
    value: "none",
    label: "Chưa biết hiragana/katakana",
    description: "Lộ trình sẽ bắt đầu từ cách đọc, viết và nhận diện kana.",
    kanaLevel: "none",
    retention: "none",
  },
  {
    value: "hiragana_low",
    label: "Biết hiragana, chưa chắc katakana",
    description: "Cần củng cố katakana trước khi vào từ vựng N5 nhiều hơn.",
    kanaLevel: "hiragana",
    retention: "low",
  },
  {
    value: "both_medium",
    label: "Biết cả hai nhưng đọc còn chậm",
    description: "Có thể học N5 sớm, nhưng vẫn cần luyện tốc độ đọc kana.",
    kanaLevel: "hiragana_katakana",
    retention: "medium",
  },
  {
    value: "both_high",
    label: "Đọc kana khá ổn",
    description: "Có thể đi nhanh hơn vào từ vựng, ngữ pháp và câu mẫu.",
    kanaLevel: "hiragana_katakana",
    retention: "high",
  },
  {
    value: "unknown",
    label: "Không chắc, muốn kiểm tra nhanh",
    description: "Hệ thống sẽ đề xuất placement test trước khi chốt điểm bắt đầu.",
    kanaLevel: "keep",
    retention: "unknown",
    needsPlacement: true,
  },
]

const deadlineOptions: { value: JlptDeadline; label: string }[] = [
  { value: "3_months", label: "3 tháng" },
  { value: "6_months", label: "6 tháng" },
  { value: "12_months", label: "12 tháng" },
  { value: "unsure", label: "Chưa rõ" },
]

const goalLabels: Record<LearningGoal, string> = {
  FROM_ZERO: "Bắt đầu từ số 0",
  JLPT_N5: "Thi JLPT N5",
  COMMUNICATION: "Giao tiếp cơ bản",
}

const kanaLabels: Record<KanaLevel, string> = {
  none: "Chưa biết kana",
  hiragana: "Biết hiragana",
  hiragana_katakana: "Biết hiragana + katakana",
}

const metadataPrefixes = [
  "profile:kanaRetention:",
  "profile:jlptDeadline:",
  "profile:planType:",
  "profile:needsPlacement:",
  "kanaRetention:",
  "jlptDeadline:",
]

function hasMetadata(items: string[], value: string) {
  return items.includes(value)
}

function getMetadataValue(items: string[], prefix: string, fallback: string) {
  const entry = items.find((item) => item.startsWith(prefix))
  return entry ? entry.slice(prefix.length) : fallback
}

function getStoredKanaChoice(items: string[], kanaLevel: KanaLevel): KanaChoice {
  if (hasMetadata(items, "profile:needsPlacement:true")) return "unknown"

  const retention = getMetadataValue(
    items,
    "profile:kanaRetention:",
    getMetadataValue(items, "kanaRetention:", "")
  )

  if (retention === "none") return "none"
  if (retention === "low") return "hiragana_low"
  if (retention === "medium") return "both_medium"
  if (retention === "high") return "both_high"
  if (retention === "unknown") return "unknown"

  if (kanaLevel === "hiragana") return "hiragana_low"
  if (kanaLevel === "hiragana_katakana") return "both_medium"
  return "none"
}

function getStoredDeadline(items: string[]): JlptDeadline {
  const deadline = getMetadataValue(
    items,
    "profile:jlptDeadline:",
    getMetadataValue(items, "jlptDeadline:", "unsure")
  )
  if (deadline === "3-months") return "3_months"
  if (deadline === "6-months") return "6_months"
  if (deadline === "12-months") return "12_months"
  if (deadline === "3_months" || deadline === "6_months" || deadline === "12_months") return deadline
  return "unsure"
}

function cleanGuideSteps(items: string[], metadata: string[]) {
  const preserved = items.filter((item) => !metadataPrefixes.some((prefix) => item.startsWith(prefix)))
  const base = preserved.includes("profile-created") ? preserved : ["profile-created", ...preserved]
  return [...base, ...metadata]
}

function applyGoalChoice(choice: PlanGoal, currentGoal: LearningGoal, isExistingProfile: boolean) {
  if (choice === "REVIEW") {
    return {
      goal: isExistingProfile ? currentGoal : "FROM_ZERO",
      experience: "returning",
      planType: "review",
    } satisfies { goal: LearningGoal; experience: ExperienceLevel; planType: PlanType }
  }

  return {
    goal: choice,
    experience: choice === "FROM_ZERO" ? "new" : "some",
    planType: "standard",
  } satisfies { goal: LearningGoal; experience: ExperienceLevel; planType: PlanType }
}

function buildInternalColdStartProfile({
  goal,
  kanaLevel,
  experience,
  dailyMinutes,
  preferredTopics,
  planType,
  needsPlacement,
}: {
  goal: LearningGoal
  kanaLevel: KanaLevel
  experience: ExperienceLevel
  dailyMinutes: number
  preferredTopics: string[]
  planType: PlanType
  needsPlacement: boolean
}) {
  const reasons: string[] = []
  let score = 20

  if (planType === "review" || experience === "returning") {
    score += 12
    reasons.push("Người học quay lại sau thời gian nghỉ: ưu tiên kiểm tra lỗ hổng trước khi tăng tốc.")
  } else if (experience === "new") {
    score += 30
    reasons.push("Người học mới: bắt đầu từ nền tảng kana và mẫu câu đơn giản.")
  } else {
    score += 18
    reasons.push("Người học đã có nền tảng: cần xác định điểm bắt đầu phù hợp.")
  }

  if (kanaLevel === "none") {
    score += 25
    reasons.push("Kana chưa vững: lộ trình bắt đầu từ hiragana và katakana.")
  } else if (kanaLevel === "hiragana") {
    score += 14
    reasons.push("Đã biết hiragana: bổ sung katakana trước khi học nhiều từ vựng N5.")
  } else {
    score += 8
    reasons.push("Đã biết hiragana và katakana: có thể vào từ vựng/ngữ pháp N5 sớm hơn.")
  }

  if (goal === "JLPT_N5") {
    score += 12
    reasons.push("Mục tiêu JLPT N5: ưu tiên từ vựng, ngữ pháp, kanji và đọc hiểu cơ bản.")
  } else if (goal === "COMMUNICATION") {
    score += 10
    reasons.push("Mục tiêu giao tiếp: ưu tiên tình huống thực dụng và câu mẫu hằng ngày.")
  } else {
    score += 15
    reasons.push("Mục tiêu bắt đầu từ số 0: giảm độ khó các bài đầu tiên.")
  }

  if (dailyMinutes >= 45) {
    score += 8
    reasons.push("Thời lượng học cao: có thể chia buổi học thành học mới và ôn tập.")
  } else {
    score += 5
    reasons.push("Thời lượng học vừa phải: lộ trình cần chia thành phiên ngắn dễ duy trì.")
  }

  if (needsPlacement) {
    reasons.push("Người học chưa chắc trình độ hiện tại: cần placement test trước khi chốt lộ trình.")
  }

  if (preferredTopics.length) {
    reasons.push(`Chủ đề dùng để cá nhân hóa ví dụ: ${preferredTopics.join(", ")}.`)
  }

  return {
    coldStartScore: Math.min(100, score),
    coldStartReasons: reasons,
  }
}

function buildLearningPlanPreview({
  goal,
  kanaLevel,
  dailyMinutes,
  preferredTopics,
  planType,
  kanaChoice,
  jlptDeadline,
}: {
  goal: LearningGoal
  kanaLevel: KanaLevel
  dailyMinutes: number
  preferredTopics: string[]
  planType: PlanType
  kanaChoice: KanaChoice
  jlptDeadline: JlptDeadline
}): LearningPlanPreview {
  const needsPlacement = kanaChoice === "unknown" || planType === "review"
  const goalLabel = planType === "review" ? "Ôn lại kiến thức cũ" : goalLabels[goal]
  const startPoint = kanaChoice === "unknown"
    ? "Làm kiểm tra nhanh để xác định kana và N5 nền tảng."
    : kanaLevel === "none"
      ? "Bắt đầu từ hiragana, katakana và âm đọc cơ bản."
      : kanaLevel === "hiragana"
        ? "Củng cố katakana rồi nối sang từ vựng N5."
        : planType === "review"
          ? "Kiểm tra lỗ hổng trước, sau đó ôn phần yếu nhất."
          : "Đi vào từ vựng, ngữ pháp N5 và câu mẫu sớm hơn."

  const paceLabel = dailyMinutes >= 60
    ? "60 phút/ngày: có thể học mới, luyện tập và ôn lại trong cùng một buổi."
    : dailyMinutes >= 45
      ? "45 phút/ngày: nhịp học nhanh, phù hợp mục tiêu có deadline."
      : dailyMinutes >= 30
        ? "30 phút/ngày: nhịp cân bằng, dễ duy trì cho N5."
        : "15 phút/ngày: nhịp nhẹ, nên ưu tiên bài ngắn và ôn đều."

  let warning: string | undefined
  if (goal === "JLPT_N5" && jlptDeadline === "3_months" && dailyMinutes === 15) {
    warning = "Deadline 3 tháng với 15 phút/ngày khá gấp. Nên tăng thời lượng hoặc chấp nhận lộ trình rất tập trung."
  } else if (goal === "JLPT_N5" && jlptDeadline === "3_months" && dailyMinutes === 30) {
    warning = "Deadline 3 tháng có thể theo được, nhưng cần học đều và làm quiz kiểm tra thường xuyên."
  } else if (goal === "JLPT_N5" && jlptDeadline === "6_months" && dailyMinutes >= 30 && dailyMinutes <= 45) {
    warning = "Mốc 6 tháng với 30-45 phút/ngày là nhịp khá cân bằng cho N5."
  }

  const stages = planType === "review"
    ? [
        "Làm placement test để tìm phần đã quên.",
        "Ôn kana, từ vựng hoặc ngữ pháp đang yếu.",
        "Luyện quiz ngắn để xác nhận đã khôi phục kiến thức.",
        "Chuyển sang lộ trình N5 hoặc giao tiếp theo mục tiêu chính.",
      ]
    : goal === "JLPT_N5"
      ? [
          "Chốt điểm bắt đầu bằng kana và placement nếu cần.",
          "Học từ vựng N5 theo nhóm nghĩa và ví dụ ngắn.",
          "Học ngữ pháp N5, kanji N5 và đọc hiểu cơ bản.",
          "Làm quiz định kỳ để điều chỉnh thứ tự bài học.",
        ]
      : goal === "COMMUNICATION"
        ? [
            "Củng cố kana đủ dùng cho câu mẫu ngắn.",
            "Học từ vựng theo tình huống hằng ngày.",
            "Luyện mẫu câu giao tiếp và phản xạ hỏi đáp.",
            "Ôn lại bằng quiz nhẹ theo chủ đề đã chọn.",
          ]
        : [
            "Bắt đầu từ hiragana và katakana.",
            "Học từ vựng nền tảng kèm ví dụ rất ngắn.",
            "Làm quen mẫu câu N5 cơ bản.",
            "Chuyển sang quiz ngắn để xác định nhịp học tiếp theo.",
          ]

  const topicNote = preferredTopics.length
    ? goal === "JLPT_N5"
      ? `Chủ đề ${preferredTopics.join(", ")} chỉ dùng để cá nhân hóa ví dụ/câu hỏi; nội dung N5 cốt lõi vẫn được ưu tiên.`
      : goal === "COMMUNICATION"
        ? `Chủ đề ${preferredTopics.join(", ")} sẽ ảnh hưởng trực tiếp đến thứ tự tình huống luyện tập.`
        : planType === "review"
          ? `Chủ đề ${preferredTopics.join(", ")} sẽ được dùng sau bước chẩn đoán và ôn lỗ hổng.`
          : `Chủ đề ${preferredTopics.join(", ")} sẽ xuất hiện trong ví dụ đơn giản sau phần kana.`
    : "Bạn có thể chọn tối đa 3 chủ đề để ví dụ gần với nhu cầu hơn."

  return {
    startPoint,
    paceLabel,
    goalLabel,
    warning,
    needsCheck: needsPlacement ? "Cần kiểm tra nhanh trước khi chốt lộ trình chính xác." : undefined,
    stages,
    topicNote,
    nextRoute: needsPlacement ? "/placement-test" : "/learning-path",
  }
}

function hasProfileMeta(steps: string[] | undefined, key: string) {
  return Array.isArray(steps) && steps.includes(key)
}

function getSavedNeedsPlacement(steps: string[] | undefined, preview?: LearningPlanPreview) {
  return Boolean(
    hasProfileMeta(steps, "profile:needsPlacement:true") ||
    hasProfileMeta(steps, "profile:planType:review") ||
    preview?.nextRoute === "/placement-test"
  )
}

function getEmptyTopicCopy(goal: LearningGoal) {
  if (goal === "JLPT_N5") {
    return "Bạn có thể chọn sau. Nếu chưa chọn, hệ thống sẽ dùng ví dụ N5 mặc định."
  }
  if (goal === "COMMUNICATION") {
    return "Bạn có thể chọn sau. Nếu chưa chọn, hệ thống sẽ dùng ví dụ giao tiếp mặc định."
  }
  if (goal === "FROM_ZERO") {
    return "Bạn có thể chọn sau. Nếu chưa chọn, hệ thống sẽ dùng ví dụ nền tảng mặc định."
  }
  return "Bạn có thể chọn sau. Nếu chưa chọn, hệ thống sẽ dùng ví dụ mặc định."
}

function getResultKanaLabel(kanaLevel: KanaLevel, steps: string[]) {
  if (hasProfileMeta(steps, "profile:kanaRetention:unknown")) return "Chưa chắc, cần kiểm tra nhanh"
  if (hasProfileMeta(steps, "profile:kanaRetention:high")) return "Đọc kana khá ổn"
  if (hasProfileMeta(steps, "profile:kanaRetention:medium")) return "Biết hiragana + katakana, đọc còn chậm"
  if (hasProfileMeta(steps, "profile:kanaRetention:low")) return "Biết hiragana, chưa chắc katakana"
  if (kanaLevel === "none") return "Chưa biết hiragana/katakana"
  if (kanaLevel === "hiragana") return "Biết hiragana, chưa chắc katakana"
  return "Biết hiragana + katakana"
}

function getFallbackStartPoint(goal: LearningGoal, needsPlacement: boolean) {
  if (needsPlacement) {
    return "Cần kiểm tra đầu vào để xác định điểm bắt đầu chính xác hơn."
  }
  if (goal === "JLPT_N5") {
    return "Bắt đầu với từ vựng, ngữ pháp N5 và câu mẫu cơ bản."
  }
  if (goal === "COMMUNICATION") {
    return "Bắt đầu với hội thoại ngắn, mẫu câu hỏi đáp và tình huống hằng ngày."
  }
  return "Bắt đầu với kana, từ vựng nền tảng và mẫu câu đơn giản."
}

function getResultStages({
  goal,
  needsPlacement,
  isReview,
  previewStages,
}: {
  goal: LearningGoal
  needsPlacement: boolean
  isReview: boolean
  previewStages: string[]
}) {
  if (isReview) {
    return [
      "Làm kiểm tra đầu vào để xác định phần còn yếu.",
      "Ôn lại phần kiến thức bị hổng.",
      goal === "COMMUNICATION"
        ? "Quay lại luyện hội thoại sau khi lấp lỗ hổng nền tảng."
        : goal === "JLPT_N5"
          ? "Quay lại lộ trình N5 sau khi lấp lỗ hổng nền tảng."
          : "Chọn nhánh học tiếp theo phù hợp với mục tiêu.",
      "Bắt đầu lại lộ trình chính với thứ tự bài phù hợp hơn.",
    ]
  }

  if (goal === "JLPT_N5") {
    return needsPlacement
      ? [
          "Làm kiểm tra đầu vào để chốt điểm bắt đầu.",
          "Học từ vựng N5 theo nhóm nghĩa và ví dụ ngắn.",
          "Học ngữ pháp N5, kanji N5 và đọc hiểu cơ bản.",
          "Làm quiz định kỳ để điều chỉnh thứ tự bài học.",
        ]
      : [
          "Ôn nhanh kana nếu cần, rồi bắt đầu nội dung chính.",
          "Học từ vựng N5 theo nhóm nghĩa và ví dụ ngắn.",
          "Học ngữ pháp N5, kanji N5 và đọc hiểu cơ bản.",
          "Làm quiz định kỳ để điều chỉnh thứ tự bài học.",
        ]
  }

  if (goal === "COMMUNICATION") {
    return needsPlacement
      ? [
          "Làm kiểm tra đầu vào để xác định mức nền tảng.",
          "Ôn phần còn yếu trước khi vào hội thoại.",
          "Học mẫu câu hỏi đáp thường dùng.",
          "Luyện hội thoại theo tình huống.",
        ]
      : [
          "Bắt đầu với chào hỏi, tự giới thiệu và phản hồi ngắn.",
          "Học mẫu câu hỏi đáp thường dùng.",
          "Luyện hội thoại theo tình huống.",
          "Làm quiz ngắn để củng cố phản xạ và từ vựng.",
        ]
  }

  if (needsPlacement) {
    return [
      "Làm kiểm tra đầu vào để biết cần học kana từ đâu.",
      "Học hoặc ôn kana theo kết quả.",
      "Học từ vựng nền tảng theo ví dụ ngắn.",
      "Làm quen với mẫu câu cơ bản.",
    ]
  }

  return previewStages.length ? previewStages : [
    "Học hoặc ôn hiragana và katakana.",
    "Học từ vựng nền tảng theo ví dụ ngắn.",
    "Làm quen với mẫu câu cơ bản.",
    "Làm quiz nhỏ để củng cố trước khi học tiếp.",
  ]
}

export default function OnboardingPage() {
  const router = useRouter()
  const { isLoaded, profile, saveProfile } = useLearnerProfile()
  const [goal, setGoal] = useState<LearningGoal>(profile.goal)
  const [kanaLevel, setKanaLevel] = useState<KanaLevel>(profile.kanaLevel)
  const [experience, setExperience] = useState<ExperienceLevel>(profile.experience)
  const [dailyMinutes, setDailyMinutes] = useState(String(profile.dailyMinutes || 30))
  const [preferredTopics, setPreferredTopics] = useState(profile.preferredTopics)
  const [planType, setPlanType] = useState<PlanType>("standard")
  const [kanaChoice, setKanaChoice] = useState<KanaChoice>("none")
  const [jlptDeadline, setJlptDeadline] = useState<JlptDeadline>("unsure")
  const [availableTopicOptions, setAvailableTopicOptions] = useState(fallbackTopicOptions)
  const [isEditing, setIsEditing] = useState(!profile.completedOnboarding)

  useEffect(() => {
    let ignore = false

    fetch("/api/vocabulary")
      .then((response) => response.json() as Promise<VocabularyTopicsResponse>)
      .then((data) => {
        if (ignore) return
        const options = normalizeTopicOptions(data.topics ?? [])
        setAvailableTopicOptions(options.length ? options : fallbackTopicOptions)
      })
      .catch(() => {
        if (!ignore) setAvailableTopicOptions(fallbackTopicOptions)
      })

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    if (!isLoaded) return

    const storedPlanType = hasMetadata(profile.guideCompletedSteps, "profile:planType:review")
      ? "review"
      : "standard"

    setGoal(profile.goal)
    setKanaLevel(profile.kanaLevel)
    setExperience(profile.experience)
    setDailyMinutes(String(dailyMinuteOptions.includes(profile.dailyMinutes) ? profile.dailyMinutes : 30))
    setPreferredTopics(profile.preferredTopics)
    setPlanType(storedPlanType)
    setKanaChoice(getStoredKanaChoice(profile.guideCompletedSteps, profile.kanaLevel))
    setJlptDeadline(getStoredDeadline(profile.guideCompletedSteps))
    setIsEditing(!profile.completedOnboarding)
  }, [isLoaded, profile])

  const activeGoalChoice: PlanGoal = planType === "review" ? "REVIEW" : goal
  const dailyMinutesNumber = Number(dailyMinutes)
  const selectedKanaOption = kanaOptions.find((option) => option.value === kanaChoice) ?? kanaOptions[0]
  const needsPlacement = selectedKanaOption.needsPlacement === true || planType === "review"
  const preview = buildLearningPlanPreview({
    goal,
    kanaLevel,
    dailyMinutes: dailyMinutesNumber,
    preferredTopics,
    planType,
    kanaChoice,
    jlptDeadline,
  })
  const coldStart = buildInternalColdStartProfile({
    goal,
    kanaLevel,
    experience,
    dailyMinutes: dailyMinutesNumber,
    preferredTopics,
    planType,
    needsPlacement,
  })

  const toggleTopic = (topic: string) => {
    setPreferredTopics((current) =>
      current.includes(topic)
        ? current.filter((item) => item !== topic)
        : current.length >= 3
          ? current
          : [...current, topic]
    )
  }

  const selectGoal = (choice: PlanGoal) => {
    const next = applyGoalChoice(choice, goal, profile.completedOnboarding)
    setGoal(next.goal)
    setExperience(next.experience)
    setPlanType(next.planType)
  }

  const selectKana = (choice: KanaChoice) => {
    const option = kanaOptions.find((item) => item.value === choice)
    if (!option) return

    setKanaChoice(choice)
    if (option.kanaLevel !== "keep") {
      setKanaLevel(option.kanaLevel)
    }
  }

  const handleSubmit = () => {
    if (!isLoaded) return
    const wasCompleted = profile.completedOnboarding
    const metadata = [
      `profile:kanaRetention:${selectedKanaOption.retention}`,
      ...(goal === "JLPT_N5" ? [`profile:jlptDeadline:${jlptDeadline}`] : []),
      ...(planType === "review" ? ["profile:planType:review"] : []),
      ...(needsPlacement ? ["profile:needsPlacement:true"] : []),
    ]

    saveProfile({
      goal,
      kanaLevel,
      experience,
      dailyMinutes: dailyMinutesNumber,
      preferredTopics,
      coldStartScore: coldStart.coldStartScore,
      coldStartReasons: coldStart.coldStartReasons,
      guideCompletedSteps: cleanGuideSteps(profile.guideCompletedSteps, metadata),
      completedOnboarding: true,
    })

    if (wasCompleted) {
      setIsEditing(false)
      return
    }

    router.push(preview.nextRoute)
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
            <Spinner className="h-5 w-5" />
            <span>Đang tải hồ sơ học tập...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (profile.completedOnboarding && !isEditing) {
    const savedPlanType = hasMetadata(profile.guideCompletedSteps, "profile:planType:review") ? "review" : "standard"
    const savedKanaChoice = getStoredKanaChoice(profile.guideCompletedSteps, profile.kanaLevel)
    const savedPreview = buildLearningPlanPreview({
      goal: profile.goal,
      kanaLevel: profile.kanaLevel,
      dailyMinutes: profile.dailyMinutes,
      preferredTopics: profile.preferredTopics,
      planType: savedPlanType,
      kanaChoice: savedKanaChoice,
      jlptDeadline: getStoredDeadline(profile.guideCompletedSteps),
    })
    const savedNeedsPlacement = getSavedNeedsPlacement(profile.guideCompletedSteps, savedPreview)
    const savedIsReview = hasProfileMeta(profile.guideCompletedSteps, "profile:planType:review")
    const resultStages = getResultStages({
      goal: profile.goal,
      needsPlacement: savedNeedsPlacement,
      isReview: savedIsReview,
      previewStages: savedPreview.stages,
    })
    const resultStartPoint = savedPreview.startPoint || getFallbackStartPoint(profile.goal, savedNeedsPlacement)
    const placementNote = savedNeedsPlacement
      ? "Bạn nên làm kiểm tra đầu vào để xác định điểm bắt đầu chính xác hơn."
      : "Bạn có thể làm kiểm tra đầu vào nếu muốn hệ thống tinh chỉnh lộ trình."

    return (
      <div className="-m-6 min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_8%_12%,rgba(243,200,189,0.55),transparent_28%),linear-gradient(135deg,#fff8f1_0%,#fffdf8_50%,#f7d9d2_100%)] p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <section className="relative overflow-hidden rounded-xl bg-[#fff8f1]/85 p-6">
            <Image
              src="/assets/hero-torii.png"
              alt=""
              width={520}
              height={320}
              aria-hidden="true"
              className="pointer-events-none absolute -left-10 -bottom-10 h-52 w-72 object-contain opacity-20"
            />
            <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
              <div>
                <Badge variant="outline" className="mb-3 border-[#d89a92] bg-[#f3c8bd]/45 text-[#8f4742]">
                  Đã tạo lộ trình
                </Badge>
                <h1 className="text-3xl font-bold tracking-tight">Lộ trình học của bạn đã sẵn sàng</h1>
                <p className="mt-3 max-w-3xl text-base leading-7 text-[#4f403b]">
                  Dựa trên mục tiêu, nền tảng hiện tại và thời gian học mỗi ngày, hệ thống đã đề xuất điểm bắt đầu và các chặng học tiếp theo.
                </p>
              </div>
              <div className="relative mx-auto h-40 w-40">
                <Image src="/assets/Flower.png" alt="" width={180} height={180} aria-hidden="true" className="h-full w-full object-contain drop-shadow-[0_8px_16px_rgba(143,71,66,0.18)]" />
                <div className="absolute inset-0 grid place-items-center text-center">
                  <div>
                    <CheckCircle2 className="mx-auto h-8 w-8 text-[#8f4742]" />
                    <p className="mt-1 text-xs font-bold text-[#8f4742]">Đã tạo</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <Card className="border-none bg-transparent shadow-none" style={paperCardStyle}>
              <CardContent className="space-y-5 px-8 py-8">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-[#a34d48]" />
                  <h2 className="text-xl font-bold text-foreground">Thông tin đầu vào</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-white/55 p-4">
                    <p className="text-sm text-[#6f5952]">Mục tiêu</p>
                    <p className="mt-1 text-xl font-bold">{savedPreview.goalLabel}</p>
                    {savedIsReview && <p className="mt-1 text-xs text-[#8f4742]">Ôn lại kiến thức cũ</p>}
                  </div>
                  <div className="rounded-xl bg-white/55 p-4">
                    <p className="text-sm text-[#6f5952]">Nền tảng kana</p>
                    <p className="mt-1 text-xl font-bold">{getResultKanaLabel(profile.kanaLevel, profile.guideCompletedSteps)}</p>
                  </div>
                  <div className="rounded-xl bg-white/55 p-4">
                    <p className="text-sm text-[#6f5952]">Nhịp học</p>
                    <p className="mt-1 text-xl font-bold">{profile.dailyMinutes} phút/ngày</p>
                  </div>
                  <div className="rounded-xl bg-white/55 p-4">
                    <p className="text-sm text-[#6f5952]">Chủ đề ví dụ</p>
                    {profile.preferredTopics.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {profile.preferredTopics.map((topic) => (
                          <span key={topic} className="rounded-full bg-[#f3c8bd]/65 px-3 py-1 text-sm font-medium text-[#8f4742]">{topic}</span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-1 text-sm leading-6 text-[#6f5952]">{getEmptyTopicCopy(profile.goal)}</p>
                    )}
                  </div>
                </div>
                <div className="rounded-2xl border border-[#e3beb5] bg-white/65 p-5">
                  <div className="mb-2 flex items-center gap-2 font-bold text-[#2f211e]">
                    <Target className="h-4 w-4 text-[#a34d48]" />
                    <span>Điểm bắt đầu</span>
                  </div>
                  <p className="text-sm font-semibold leading-6 text-[#2f211e]">{resultStartPoint}</p>
                  <p className="mt-3 rounded-xl bg-[#fff8f1]/80 px-4 py-3 text-sm leading-6 text-[#6f5952]">{placementNote}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none bg-transparent shadow-none" style={paperCardStyle}>
              <CardContent className="space-y-4 px-8 py-8 text-sm text-[#6f5952]">
                <div className="flex items-center gap-2">
                  <ListChecks className="h-5 w-5 text-[#a34d48]" />
                  <h2 className="text-xl font-bold text-foreground">Các chặng tiếp theo</h2>
                </div>
                {resultStages.map((stage, index) => (
                  <div key={stage} className="flex gap-3 rounded-xl bg-white/55 px-4 py-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#f7d1c8] text-xs font-bold text-[#8f4742]">{index + 1}</span>
                    <span>{stage}</span>
                  </div>
                ))}
                <div className="grid gap-2 pt-2">
                  {savedNeedsPlacement ? (
                    <>
                      <Button className="h-11 rounded-full bg-[#ee776c] text-white shadow-md hover:bg-[#dd675e]" onClick={() => router.push("/placement-test")}>
                        Làm kiểm tra đầu vào
                      </Button>
                      <Button variant="outline" className="h-11 rounded-full border-[#dfb6aa] bg-white/60" onClick={() => router.push("/learning-path")}>
                        Xem lộ trình học
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button className="h-11 rounded-full bg-[#ee776c] text-white shadow-md hover:bg-[#dd675e]" onClick={() => router.push("/learning-path")}>
                        Bắt đầu học
                      </Button>
                      <Button variant="outline" className="h-11 rounded-full border-[#dfb6aa] bg-white/60" onClick={() => router.push("/placement-test")}>
                        Kiểm tra đầu vào để tinh chỉnh
                      </Button>
                    </>
                  )}
                  <Button variant="ghost" className="h-11 rounded-full" onClick={() => setIsEditing(true)}>
                    Chỉnh thông tin
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="-m-6 min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_8%_12%,rgba(243,200,189,0.55),transparent_28%),linear-gradient(135deg,#fff8f1_0%,#fffdf8_50%,#f7d9d2_100%)] p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="relative overflow-hidden rounded-xl bg-[#fff8f1]/85 p-6">
          <Image
            src="/assets/hero-torii.png"
            alt=""
            width={520}
            height={320}
            aria-hidden="true"
            className="pointer-events-none absolute -left-10 -bottom-10 h-52 w-72 object-contain opacity-20"
          />
          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
            <div>
              <Badge variant="outline" className="mb-3 border-[#d89a92] bg-[#f3c8bd]/45 text-[#8f4742]">
                Mất khoảng 1 phút
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight">Tạo lộ trình học tiếng Nhật</h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-[#4f403b]">
                Chọn mục tiêu, trình độ hiện tại và thời gian học mỗi ngày. Hệ thống sẽ tạo điểm bắt đầu và các chặng học rõ ràng trước khi gợi ý bài tiếp theo.
              </p>
            </div>
            <div className="relative mx-auto h-40 w-40">
              <Image src="/assets/Flower.png" alt="" width={180} height={180} aria-hidden="true" className="h-full w-full object-contain drop-shadow-[0_8px_16px_rgba(143,71,66,0.18)]" />
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <div className="space-y-5">
            <Card className="border-none bg-transparent shadow-none" style={paperCardStyle}>
              <CardHeader className="px-8 pt-8">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Target className="h-5 w-5 text-[#a34d48]" />
                  Mục tiêu chính
                </CardTitle>
                <CardDescription>Chọn hướng học để hệ thống ưu tiên đúng nội dung ngay từ đầu.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 px-8 pb-8 md:grid-cols-2">
                {goalOptions.map((option) => {
                  const Icon = option.icon
                  const selected = activeGoalChoice === option.value

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => selectGoal(option.value)}
                      aria-pressed={selected}
                      className={`rounded-2xl border p-4 text-left transition-all ${
                        selected
                          ? "border-[#8f4742] bg-[#ee776c] text-white shadow-[0_10px_18px_rgba(143,71,66,0.22)]"
                          : "border-[#e7c7bc] bg-white/65 text-[#2a211f] hover:border-[#d68f84] hover:bg-[#f3c8bd]/55"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-3">
                          <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${
                            selected ? "bg-white/20" : "bg-[#f7d1c8]"
                          }`}>
                            <Icon className={`h-5 w-5 ${selected ? "text-white" : "text-[#8f4742]"}`} />
                          </div>
                          <div>
                            <p className="font-bold">{option.label}</p>
                            <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${
                              selected ? "bg-white/20 text-white" : "bg-[#f7d1c8] text-[#8f4742]"
                            }`}>
                              {option.badge}
                            </span>
                          </div>
                        </div>
                        {selected ? (
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-white" />
                        ) : (
                          <span className="h-5 w-5 shrink-0 rounded-full border border-[#d8afa5] bg-white/70" />
                        )}
                      </div>
                      <p className={`mt-3 text-sm leading-6 ${selected ? "text-white/90" : "text-[#6f5952]"}`}>{option.description}</p>
                    </button>
                  )
                })}
              </CardContent>
            </Card>

            <Card className="border-none bg-transparent shadow-none" style={paperCardStyle}>
              <CardHeader className="px-8 pt-8">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Languages className="h-5 w-5 text-[#a34d48]" />
                  Nền tảng kana hiện tại
                </CardTitle>
                <CardDescription>Chọn mô tả gần nhất với khả năng đọc hiragana/katakana của bạn.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 px-8 pb-8">
                {kanaOptions.map((option) => {
                  const selected = kanaChoice === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => selectKana(option.value)}
                      aria-pressed={selected}
                      className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition-all ${
                        selected
                          ? "border-[#8f4742] bg-[#ee776c] text-white shadow-md"
                          : "border-[#e7c7bc] bg-white/65 text-[#2a211f] hover:border-[#d68f84] hover:bg-[#f3c8bd]/55"
                      }`}
                    >
                      {selected ? (
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                      ) : (
                        <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full border border-[#d8afa5] bg-white/70" />
                      )}
                      <span>
                        <span className="block font-semibold">{option.label}</span>
                        <span className={`mt-1 block text-sm leading-6 ${selected ? "text-white/90" : "text-[#6f5952]"}`}>{option.description}</span>
                      </span>
                    </button>
                  )
                })}
              </CardContent>
            </Card>

            <Card className="border-none bg-transparent shadow-none" style={paperCardStyle}>
              <CardHeader className="px-8 pt-8">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Clock className="h-5 w-5 text-[#a34d48]" />
                  Thời gian học mỗi ngày
                </CardTitle>
                <CardDescription>Chọn nhịp học thực tế để lộ trình không bị quá tải.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 px-8 pb-8">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {dailyMinuteOptions.map((minutes) => {
                    const selected = dailyMinutes === String(minutes)
                    return (
                      <button
                        key={minutes}
                        type="button"
                        onClick={() => setDailyMinutes(String(minutes))}
                        aria-pressed={selected}
                        className={`rounded-2xl border px-4 py-4 text-center transition-all ${
                          selected
                            ? "border-[#8f4742] bg-[#ee776c] text-white shadow-md"
                            : "border-[#e7c7bc] bg-white/65 text-[#2a211f] hover:border-[#d68f84] hover:bg-[#f3c8bd]/55"
                        }`}
                      >
                        <span className="block text-2xl font-extrabold">{minutes}</span>
                        <span className="text-xs font-medium">phút/ngày</span>
                      </button>
                    )
                  })}
                </div>

                {goal === "JLPT_N5" && (
                  <div className="rounded-2xl bg-white/55 p-4">
                    <div className="mb-3 flex items-center gap-2 font-semibold text-[#2f211e]">
                      <CalendarClock className="h-4 w-4 text-[#a34d48]" />
                      Bạn dự định thi JLPT N5 khi nào?
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {deadlineOptions.map((option) => {
                        const selected = jlptDeadline === option.value
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setJlptDeadline(option.value)}
                            aria-pressed={selected}
                            className={`rounded-full border px-3 py-2 text-sm font-semibold transition-all ${
                              selected
                                ? "border-[#8f4742] bg-[#8f4742] text-white"
                                : "border-[#e7c7bc] bg-white/70 text-[#6f5952] hover:border-[#d68f84]"
                            }`}
                          >
                            {option.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-none bg-transparent shadow-none" style={paperCardStyle}>
              <CardHeader className="px-8 pt-8">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <BookOpen className="h-5 w-5 text-[#a34d48]" />
                  Chủ đề dùng để cá nhân hóa ví dụ
                </CardTitle>
                <CardDescription>
                  Chọn tối đa 3 chủ đề. Chủ đề giúp ví dụ gần với bạn hơn, không thay thế mục tiêu học chính.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <div className="mb-3 flex items-center justify-between gap-3 text-sm font-medium text-[#8f4742]">
                  <span>Đã chọn {preferredTopics.length}/3 chủ đề</span>
                  <span className="text-xs text-[#6f5952]">Bỏ chọn một mục nếu muốn đổi chủ đề.</span>
                </div>
                <div className="mb-4 rounded-xl bg-white/60 px-4 py-3 text-xs leading-5 text-[#6f5952]">
                  {preview.topicNote}
                </div>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {availableTopicOptions.map((topic) => {
                    const selected = preferredTopics.includes(topic.label)
                    const disabledByLimit = !selected && preferredTopics.length >= 3

                    return (
                      <button
                        key={topic.label}
                        type="button"
                        onClick={() => toggleTopic(topic.label)}
                        aria-pressed={selected}
                        className={`flex items-center justify-between gap-3 rounded-full border px-4 py-3 text-left text-sm font-medium transition-all ${
                          selected
                            ? "border-[#8f4742] bg-[#ee776c] text-white shadow-md"
                            : disabledByLimit
                              ? "border-[#ead6cf] bg-white/45 text-[#9b8a84] opacity-70"
                              : "border-[#e7c7bc] bg-white/65 text-[#2a211f] hover:border-[#d68f84] hover:bg-[#f3c8bd]/55"
                        }`}
                      >
                        <span><span className="mr-2">{topic.icon}</span>{topic.label}</span>
                        {selected ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                        ) : (
                          <span className="h-4 w-4 shrink-0 rounded-full border border-[#d8afa5] bg-white/70" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <Card className="border-none bg-transparent shadow-none" style={paperCardStyle}>
              <CardContent className="space-y-5 px-8 py-8 text-sm text-[#6f5952]">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f7d1c8] text-[#8f4742]">
                    <ListChecks className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Xem trước lộ trình</h2>
                    <p className="mt-1 text-xs leading-5">Tóm tắt những gì hệ thống sẽ tạo sau khi lưu.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl bg-white/60 px-4 py-3">
                    <div className="mb-1 flex items-center gap-2 font-semibold text-[#2f211e]">
                      <Compass className="h-4 w-4 text-[#a34d48]" />
                      <span>Điểm bắt đầu</span>
                    </div>
                    <p className="text-xs leading-5">{preview.startPoint}</p>
                  </div>
                  <div className="rounded-xl bg-white/60 px-4 py-3">
                    <div className="mb-1 flex items-center gap-2 font-semibold text-[#2f211e]">
                      <Clock className="h-4 w-4 text-[#a34d48]" />
                      <span>Nhịp học</span>
                    </div>
                    <p className="text-xs leading-5">{preview.paceLabel}</p>
                  </div>
                  <div className="rounded-xl bg-white/60 px-4 py-3">
                    <div className="mb-1 flex items-center gap-2 font-semibold text-[#2f211e]">
                      <Target className="h-4 w-4 text-[#a34d48]" />
                      <span>Mục tiêu</span>
                    </div>
                    <p className="text-xs leading-5">{preview.goalLabel}</p>
                  </div>
                </div>

                {preview.warning && (
                  <div className="flex gap-3 rounded-xl border border-[#e7b18d] bg-[#fff3df] px-4 py-3 text-[#7a4a16]">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p className="text-xs leading-5">{preview.warning}</p>
                  </div>
                )}

                {preview.needsCheck && (
                  <div className="flex gap-3 rounded-xl border border-[#dfb6aa] bg-white/70 px-4 py-3 text-[#6f5952]">
                    <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-[#a34d48]" />
                    <p className="text-xs leading-5">{preview.needsCheck}</p>
                  </div>
                )}

                <div className="space-y-3">
                  <h3 className="font-bold text-[#2f211e]">Các chặng dự kiến</h3>
                  {preview.stages.map((stage, index) => (
                    <div key={stage} className="flex gap-3 rounded-xl bg-white/60 px-4 py-3">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#f7d1c8] text-xs font-bold text-[#8f4742]">{index + 1}</span>
                      <span className="text-xs leading-5">{stage}</span>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl bg-white/60 px-4 py-3 text-xs leading-5">
                  {preview.topicNote}
                </div>

                <div className="sticky bottom-3 -mx-2 rounded-2xl bg-[#fff8f1]/90 p-2 backdrop-blur lg:static lg:bg-transparent lg:p-0">
                  <Button className="h-14 w-full rounded-full bg-[#8f4742] text-base font-bold text-white shadow-[0_12px_24px_rgba(143,71,66,0.28)] hover:bg-[#743b37]" size="lg" onClick={handleSubmit} disabled={!isLoaded}>
                    <Save className="mr-2 h-5 w-5" />
                    {profile.completedOnboarding ? "Cập nhật lộ trình" : "Tạo lộ trình của tôi"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  )
}
