"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { BookOpen, Clock, Goal, Languages, Target } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
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

export default function OnboardingPage() {
  const router = useRouter()
  const { profile, saveProfile } = useLearnerProfile()
  const [goal, setGoal] = useState<LearningGoal>(profile.goal)
  const [kanaLevel, setKanaLevel] = useState<KanaLevel>(profile.kanaLevel)
  const [experience, setExperience] = useState<ExperienceLevel>(profile.experience)
  const [dailyMinutes, setDailyMinutes] = useState(String(profile.dailyMinutes))
  const [preferredTopics, setPreferredTopics] = useState(profile.preferredTopics)

  const toggleTopic = (topic: string) => {
    setPreferredTopics((current) =>
      current.includes(topic)
        ? current.filter((item) => item !== topic)
        : [...current, topic]
    )
  }

  const handleSubmit = () => {
    saveProfile({
      goal,
      kanaLevel,
      experience,
      dailyMinutes: Number(dailyMinutes),
      preferredTopics,
      completedOnboarding: true,
    })
    router.push("/placement-test")
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-lg border bg-card p-6">
        <Badge variant="outline" className="mb-3">Bước 1/2</Badge>
        <h1 className="text-2xl font-bold">Khởi tạo hồ sơ học tập</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Hệ thống cần biết mục tiêu, nền tảng kana và thời gian học mỗi ngày để tạo lộ trình N5 hợp lý.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Goal className="h-5 w-5 text-primary" />
                Mục tiêu học
              </CardTitle>
              <CardDescription>Chọn hướng học chính để hệ thống ưu tiên đúng nội dung.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              {goalOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setGoal(option.value)}
                  className={`rounded-lg border p-4 text-left transition-colors ${
                    goal === option.value ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                  }`}
                >
                  <p className="font-semibold">{option.label}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{option.description}</p>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="h-5 w-5 text-primary" />
                Nền tảng hiện tại
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Trình độ kana</Label>
                <Select value={kanaLevel} onValueChange={(value) => setKanaLevel(value as KanaLevel)}>
                  <SelectTrigger>
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
                  <SelectTrigger>
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
                  <SelectTrigger>
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Chủ đề ưu tiên
              </CardTitle>
              <CardDescription>Dùng để chọn từ vựng mở đầu phù hợp hơn với người học.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {topicOptions.map((topic) => (
                <label key={topic} className="flex items-center gap-3 rounded-lg border p-3">
                  <Checkbox
                    checked={preferredTopics.includes(topic)}
                    onCheckedChange={() => toggleTopic(topic)}
                  />
                  <span className="text-sm font-medium">{topic}</span>
                </label>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Sau bước này
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="font-medium text-foreground">1. Làm placement test</p>
              <p className="mt-1">Kiểm tra nhanh kana, từ vựng và ngữ pháp nền tảng.</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="font-medium text-foreground">2. Sinh lộ trình đầu tiên</p>
              <p className="mt-1">AI recommendation dùng hồ sơ này để chọn bài học phù hợp.</p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-4">
              <Clock className="h-4 w-4 text-primary" />
              <span>Mục tiêu hiện tại: {dailyMinutes} phút/ngày</span>
            </div>
            <Button className="w-full" size="lg" onClick={handleSubmit}>
              Tiếp tục làm kiểm tra đầu vào
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
