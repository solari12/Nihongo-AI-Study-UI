"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { BookOpen, Clock, Goal, Languages, Target } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  type ExperienceLevel,
  type KanaLevel,
  type LearningGoal,
  useLearnerProfile,
} from "@/hooks/use-learner-profile"

const topicOptions = ["Chào hỏi", "Trường học", "Gia đình", "Thời gian", "Đồ vật", "Số đếm"]

const paperCardStyle = {
  backgroundColor: "transparent",
  backgroundImage: "url('/assets/paper-card-bg-clean.png')",
  backgroundRepeat: "no-repeat",
  backgroundSize: "100% 100%",
  backgroundPosition: "center",
} as const

const goalOptions: { value: LearningGoal; label: string; description: string }[] = [
  {
    value: "FROM_ZERO",
    label: "Học từ đầu",
    description: "Ưu tiên kana, từ vựng nền tảng và mẫu câu rất cơ bản.",
  },
  {
    value: "JLPT_N5",
    label: "Thi JLPT N5",
    description: "Tập trung vào từ vựng, ngữ pháp và quiz theo chuẩn N5.",
  },
  {
    value: "COMMUNICATION",
    label: "Giao tiếp cơ bản",
    description: "Ưu tiên chào hỏi, tình huống hằng ngày và câu mẫu thực dụng.",
  },
]

const goalLabels: Record<LearningGoal, string> = {
  FROM_ZERO: "Học từ đầu",
  JLPT_N5: "Thi JLPT N5",
  COMMUNICATION: "Giao tiếp cơ bản",
}

const kanaLabels: Record<KanaLevel, string> = {
  none: "Chưa biết kana",
  hiragana: "Biết hiragana",
  hiragana_katakana: "Biết hiragana + katakana",
}

const experienceLabels: Record<ExperienceLevel, string> = {
  new: "Người mới hoàn toàn",
  some: "Đã học một ít",
  returning: "Học lại sau thời gian nghỉ",
}

function buildColdStartProfile({
  goal,
  kanaLevel,
  experience,
  dailyMinutes,
  preferredTopics,
}: {
  goal: LearningGoal
  kanaLevel: KanaLevel
  experience: ExperienceLevel
  dailyMinutes: number
  preferredTopics: string[]
}) {
  const reasons: string[] = []
  let score = 20

  if (experience === "new") {
    score += 30
    reasons.push("Người mới hoàn toàn: ưu tiên hướng dẫn từng bước và bài nền tảng.")
  } else if (experience === "some") {
    score += 18
    reasons.push("Đã học một ít: cần placement test để tránh học lại quá nhiều.")
  } else {
    score += 12
    reasons.push("Học lại sau thời gian nghỉ: ưu tiên ôn tập và kiểm tra lỗ hổng.")
  }

  if (kanaLevel === "none") {
    score += 25
    reasons.push("Chưa biết kana: bắt đầu từ kana và từ vựng rất cơ bản.")
  } else if (kanaLevel === "hiragana") {
    score += 14
    reasons.push("Biết hiragana: cần bổ sung katakana trước khi tăng tốc N5.")
  } else {
    score += 6
    reasons.push("Đã biết hiragana + katakana: có thể vào từ vựng/ngữ pháp N5 sớm hơn.")
  }

  if (goal === "FROM_ZERO") {
    score += 15
    reasons.push("Mục tiêu học từ đầu: hệ thống sẽ giảm độ khó bài đầu tiên.")
  } else if (goal === "JLPT_N5") {
    score += 10
    reasons.push("Mục tiêu JLPT N5: ưu tiên nội dung có thể đo bằng quiz.")
  } else {
    score += 8
    reasons.push("Mục tiêu giao tiếp: ưu tiên chủ đề thực dụng và câu mẫu hàng ngày.")
  }

  if (dailyMinutes <= 10) {
    score += 10
    reasons.push("Thời gian học ngắn: chia bài thành phiên nhỏ để dễ duy trì.")
  }

  if (preferredTopics.length > 0) {
    reasons.push(`Chủ đề quan tâm: ${preferredTopics.join(", ")}.`)
  }

  return {
    coldStartScore: Math.min(100, score),
    coldStartReasons: reasons,
  }
}

export default function OnboardingPage() {
  const router = useRouter()
  const { isLoaded, profile, saveProfile } = useLearnerProfile()
  const [goal, setGoal] = useState<LearningGoal>(profile.goal)
  const [kanaLevel, setKanaLevel] = useState<KanaLevel>(profile.kanaLevel)
  const [experience, setExperience] = useState<ExperienceLevel>(profile.experience)
  const [dailyMinutes, setDailyMinutes] = useState(String(profile.dailyMinutes))
  const [preferredTopics, setPreferredTopics] = useState(profile.preferredTopics)
  const [isEditing, setIsEditing] = useState(!profile.completedOnboarding)

  useEffect(() => {
    if (!isLoaded) return
    setGoal(profile.goal)
    setKanaLevel(profile.kanaLevel)
    setExperience(profile.experience)
    setDailyMinutes(String(profile.dailyMinutes))
    setPreferredTopics(profile.preferredTopics)
    setIsEditing(!profile.completedOnboarding)
  }, [isLoaded, profile])

  const coldStart = buildColdStartProfile({
    goal,
    kanaLevel,
    experience,
    dailyMinutes: Number(dailyMinutes),
    preferredTopics,
  })

  const toggleTopic = (topic: string) => {
    setPreferredTopics((current) =>
      current.includes(topic)
        ? current.filter((item) => item !== topic)
        : [...current, topic]
    )
  }

  const handleSubmit = () => {
    if (!isLoaded) return
    const wasCompleted = profile.completedOnboarding

    saveProfile({
      goal,
      kanaLevel,
      experience,
      dailyMinutes: Number(dailyMinutes),
      preferredTopics,
      coldStartScore: coldStart.coldStartScore,
      coldStartReasons: coldStart.coldStartReasons,
      guideCompletedSteps: ["profile-created"],
      completedOnboarding: true,
    })

    if (wasCompleted) {
      setIsEditing(false)
      return
    }

    router.push("/placement-test")
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
                <Badge variant="outline" className="mb-3 border-[#d89a92] bg-[#f3c8bd]/45 text-[#8f4742]">Hồ sơ học</Badge>
                <h1 className="text-3xl font-bold tracking-tight">Hồ sơ học của bạn</h1>
                <p className="mt-3 max-w-3xl text-base leading-7 text-[#4f403b]">
                  Đây là thông tin hệ thống dùng để tạo cold-start point và gợi ý lộ trình học N5. Bạn có thể chỉnh sửa khi mục tiêu hoặc thời gian học thay đổi.
                </p>
              </div>
              <div className="relative mx-auto h-40 w-40">
                <Image src="/assets/Flower.png" alt="" width={180} height={180} aria-hidden="true" className="h-full w-full object-contain drop-shadow-[0_8px_16px_rgba(143,71,66,0.18)]" />
                <div className="absolute inset-0 grid place-items-center text-center">
                  <div>
                    <p className="text-xs font-medium leading-4 text-[#6f5952]">Cold-start</p>
                    <p className="text-4xl font-semibold tracking-tight">{profile.coldStartScore}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <Card className="border-none bg-transparent shadow-none" style={paperCardStyle}>
              <CardContent className="grid gap-4 px-8 py-8 sm:grid-cols-2">
                <div className="rounded-xl bg-white/55 p-4">
                  <p className="text-sm text-[#6f5952]">Mục tiêu học</p>
                  <p className="mt-1 text-xl font-bold">{goalLabels[profile.goal]}</p>
                </div>
                <div className="rounded-xl bg-white/55 p-4">
                  <p className="text-sm text-[#6f5952]">Trình độ kana</p>
                  <p className="mt-1 text-xl font-bold">{kanaLabels[profile.kanaLevel]}</p>
                </div>
                <div className="rounded-xl bg-white/55 p-4">
                  <p className="text-sm text-[#6f5952]">Kinh nghiệm</p>
                  <p className="mt-1 text-xl font-bold">{experienceLabels[profile.experience]}</p>
                </div>
                <div className="rounded-xl bg-white/55 p-4">
                  <p className="text-sm text-[#6f5952]">Thời gian mỗi ngày</p>
                  <p className="mt-1 text-xl font-bold">{profile.dailyMinutes} phút</p>
                </div>
                <div className="rounded-xl bg-white/55 p-4 sm:col-span-2">
                  <p className="text-sm text-[#6f5952]">Chủ đề quan tâm</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {profile.preferredTopics.map((topic) => (
                      <span key={topic} className="rounded-full bg-[#f3c8bd]/65 px-3 py-1 text-sm font-medium text-[#8f4742]">{topic}</span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none bg-transparent shadow-none" style={paperCardStyle}>
              <CardContent className="space-y-4 px-8 py-8 text-sm text-[#6f5952]">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-[#a34d48]" />
                  <h2 className="text-xl font-bold text-foreground">Hệ thống đang dùng hồ sơ này</h2>
                </div>
                {profile.coldStartReasons.slice(0, 4).map((reason) => (
                  <div key={reason} className="rounded-xl bg-white/55 px-4 py-3">{reason}</div>
                ))}
                <div className="grid gap-2 pt-2">
                  <Button className="h-11 rounded-full bg-[#ee776c] text-white shadow-md hover:bg-[#dd675e]" onClick={() => setIsEditing(true)}>
                    Chỉnh sửa hồ sơ
                  </Button>
                  <Button variant="outline" className="h-11 rounded-full border-[#dfb6aa] bg-white/60" onClick={() => router.push("/placement-test")}>
                    Làm lại placement test
                  </Button>
                  <Button variant="ghost" className="h-11 rounded-full" onClick={() => router.push("/learning-path")}>
                    Xem lộ trình học
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
                {profile.completedOnboarding ? "Chỉnh sửa hồ sơ" : "Bước 1/2"}
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight">{profile.completedOnboarding ? "Chỉnh sửa hồ sơ học tập" : "Khởi tạo hồ sơ học tập"}</h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-[#4f403b]">
                Trang này dùng để hỏi mục tiêu, trình độ hiện tại và thời gian học của bạn. Từ đó hệ thống tạo cold-start point và chọn lộ trình N5 phù hợp trước khi bạn có lịch sử học.
              </p>
            </div>
            <div className="relative mx-auto h-40 w-40">
              <Image src="/assets/Flower.png" alt="" width={180} height={180} aria-hidden="true" className="h-full w-full object-contain drop-shadow-[0_8px_16px_rgba(143,71,66,0.18)]" />
              <div className="absolute inset-0 grid place-items-center text-center">
                <div>
                  <p className="text-xs font-medium leading-4 text-[#6f5952]">Cold-start</p>
                  <p className="text-4xl font-semibold tracking-tight">{coldStart.coldStartScore}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <div className="space-y-5">
            <Card className="border-none bg-transparent shadow-none" style={paperCardStyle}>
              <CardHeader className="px-8 pt-8">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Goal className="h-5 w-5 text-[#a34d48]" />
                  Mục tiêu học
                </CardTitle>
                <CardDescription>Chọn hướng học chính để hệ thống ưu tiên đúng nội dung.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 px-8 pb-8 md:grid-cols-3">
                {goalOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setGoal(option.value)}
                    className={`rounded-xl p-4 text-left transition-all ${
                      goal === option.value ? "bg-[#ee776c] text-white shadow-md" : "bg-white/55 text-[#2a211f] hover:bg-[#f3c8bd]/55"
                    }`}
                  >
                    <p className="font-bold">{option.label}</p>
                    <p className={`mt-2 text-sm leading-6 ${goal === option.value ? "text-white/90" : "text-[#6f5952]"}`}>{option.description}</p>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card className="border-none bg-transparent shadow-none" style={paperCardStyle}>
              <CardHeader className="px-8 pt-8">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Languages className="h-5 w-5 text-[#a34d48]" />
                  Nền tảng hiện tại
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 px-8 pb-8 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Trình độ kana</Label>
                  <Select value={kanaLevel} onValueChange={(value) => setKanaLevel(value as KanaLevel)}>
                    <SelectTrigger className="border-[#dfb6aa] bg-white/70">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Chưa biết kana</SelectItem>
                      <SelectItem value="hiragana">Biết hiragana</SelectItem>
                      <SelectItem value="hiragana_katakana">Biết hiragana + katakana</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Kinh nghiệm</Label>
                  <Select value={experience} onValueChange={(value) => setExperience(value as ExperienceLevel)}>
                    <SelectTrigger className="border-[#dfb6aa] bg-white/70">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Người mới hoàn toàn</SelectItem>
                      <SelectItem value="some">Đã học một ít</SelectItem>
                      <SelectItem value="returning">Học lại sau thời gian nghỉ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Thời gian mỗi ngày</Label>
                  <Select value={dailyMinutes} onValueChange={setDailyMinutes}>
                    <SelectTrigger className="border-[#dfb6aa] bg-white/70">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 phút</SelectItem>
                      <SelectItem value="20">20 phút</SelectItem>
                      <SelectItem value="30">30 phút</SelectItem>
                      <SelectItem value="45">45 phút</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none bg-transparent shadow-none" style={paperCardStyle}>
              <CardHeader className="px-8 pt-8">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Target className="h-5 w-5 text-[#a34d48]" />
                  Chủ đề ưu tiên
                </CardTitle>
                <CardDescription>Dùng để chọn từ vựng mở đầu phù hợp hơn với người học.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 px-8 pb-8 sm:grid-cols-2 md:grid-cols-3">
                {topicOptions.map((topic) => (
                  <label key={topic} className="flex items-center gap-3 rounded-xl bg-white/55 p-3">
                    <Checkbox checked={preferredTopics.includes(topic)} onCheckedChange={() => toggleTopic(topic)} />
                    <span className="text-sm font-medium">{topic}</span>
                  </label>
                ))}
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-4">
            <Card className="border-none bg-transparent shadow-none" style={paperCardStyle}>
              <CardContent className="space-y-4 px-8 py-8 text-sm text-[#6f5952]">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-[#a34d48]" />
                  <h2 className="text-xl font-bold text-foreground">Sau bước này</h2>
                </div>
                {coldStart.coldStartReasons.slice(0, 4).map((reason) => (
                  <div key={reason} className="rounded-xl bg-white/55 px-4 py-3">{reason}</div>
                ))}
                <div className="flex items-center gap-2 rounded-xl bg-white/55 px-4 py-3">
                  <Clock className="h-4 w-4 text-[#a34d48]" />
                  <span>{dailyMinutes} phút/ngày</span>
                </div>
                <Button className="h-11 w-full rounded-full bg-[#ee776c] text-white shadow-md hover:bg-[#dd675e]" size="lg" onClick={handleSubmit} disabled={!isLoaded}>
                  {profile.completedOnboarding ? "Lưu thay đổi hồ sơ" : "Lưu hồ sơ và làm kiểm tra đầu vào"}
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  )
}
