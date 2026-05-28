"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { Brain, CheckCircle2, Home, RotateCcw, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { evaluatePlacement, placementQuestions } from "@/lib/onboarding/placement-test"
import { useLearnerProfile } from "@/hooks/use-learner-profile"

type TestState = "playing" | "result"

const areaLabels = {
  kana: "Kana",
  vocabulary: "Từ vựng",
  grammar: "Ngữ pháp",
}

const levelLabels = {
  absolute_beginner: "Beginner hoàn toàn",
  early_n5: "Đầu N5",
  n5_review: "Ôn tập N5",
}

export default function PlacementTestPage() {
  const router = useRouter()
  const { isLoaded, profile, placement, savePlacementResult } = useLearnerProfile()
  const [testState, setTestState] = useState<TestState>(placement.completed ? "result" : "playing")
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState(placement)
  const question = placementQuestions[currentQuestion]
  const progress = ((currentQuestion + 1) / placementQuestions.length) * 100

  const evaluatedResult = useMemo(
    () => evaluatePlacement({ answers, goal: profile.goal, kanaLevel: profile.kanaLevel }),
    [answers, profile.goal, profile.kanaLevel]
  )

  useEffect(() => {
    if (!isLoaded) return

    if (!profile.completedOnboarding) {
      router.replace("/onboarding")
      return
    }

    if (placement.completed) {
      setResult(placement)
      setTestState("result")
    }
  }, [isLoaded, placement, profile.completedOnboarding, router])

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

  if (!profile.completedOnboarding) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
            <Spinner className="h-5 w-5" />
            <span>Chuyển về bước tạo hồ sơ học tập...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  const submitTest = () => {
    const saved = savePlacementResult(evaluatedResult)
    setResult(saved)
    setTestState("result")
  }

  const handleNext = () => {
    if (currentQuestion === placementQuestions.length - 1) {
      submitTest()
      return
    }

    setCurrentQuestion((current) => current + 1)
  }

  const restart = () => {
    setAnswers({})
    setCurrentQuestion(0)
    setTestState("playing")
  }

  if (testState === "result") {
    const activeResult = result.completed ? result : placement

    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Card className="text-center">
          <CardContent className="px-6 pb-8 pt-8">
            <Sparkles className="mx-auto mb-4 h-12 w-12 text-primary" />
            <Badge variant="outline" className="mb-3">Hoàn tất kiểm tra đầu vào</Badge>
            <h1 className="text-3xl font-bold">{levelLabels[activeResult.level]}</h1>
            <p className="mt-2 text-muted-foreground">
              Kết quả: {activeResult.score}/{activeResult.total} câu đúng ({activeResult.percentage}%)
            </p>
            <Progress value={activeResult.percentage} className="mx-auto mt-6 h-2 max-w-xl" />
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Cold-start point</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{profile.coldStartScore}/100</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Dùng khi tài khoản mới chưa có lịch sử học.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Điểm yếu cần xử lý</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {activeResult.weakAreas.length ? (
                activeResult.weakAreas.map((area) => (
                  <Badge key={area} variant="secondary">
                    {areaLabels[area as keyof typeof areaLabels]}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">Chưa có điểm yếu rõ rệt.</span>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Điểm bắt đầu</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{activeResult.recommendedStart}</p>
              <p className="mt-1 text-sm text-muted-foreground">Dùng để sinh gợi ý học đầu tiên.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Mục tiêu học</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{profile.dailyMinutes} phút/ngày</p>
              <p className="mt-1 text-sm text-muted-foreground">Lộ trình sẽ ưu tiên khối lượng phù hợp.</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Lộ trình tiếp theo
            </CardTitle>
            <CardDescription>
              Recommendation engine sẽ dùng hồ sơ + placement test + tiến độ học để xếp hạng bài học.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/learning-path">Xem lộ trình AI</Link>
            </Button>
            <Button variant="outline" onClick={restart}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Làm lại test
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                <Home className="mr-2 h-4 w-4" />
                Về dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Badge variant="outline" className="mb-3">Bước 2/2</Badge>
        <h1 className="text-2xl font-bold">Kiểm tra đầu vào</h1>
        <p className="mt-1 text-muted-foreground">
          Bài test ngắn để xác định điểm bắt đầu trước khi sinh lộ trình học.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span>Câu {currentQuestion + 1}/{placementQuestions.length}</span>
          <Badge variant="secondary">{areaLabels[question.area]}</Badge>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{question.question}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {question.answers.map((answer, index) => {
            const selected = answers[question.id] === answer.id

            return (
              <button
                key={answer.id}
                type="button"
                onClick={() => setAnswers((current) => ({ ...current, [question.id]: answer.id }))}
                className={cn(
                  "flex items-center gap-4 rounded-lg border-2 p-4 text-left transition-colors",
                  selected ? "border-primary bg-primary/5 ring-2 ring-primary" : "hover:bg-muted/50"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                    selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"
                  )}
                >
                  {String.fromCharCode(65 + index)}
                </span>
                <span>{answer.text}</span>
              </button>
            )
          })}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          disabled={currentQuestion === 0}
          onClick={() => setCurrentQuestion((current) => current - 1)}
        >
          Câu trước
        </Button>
        <Button disabled={!answers[question.id]} onClick={handleNext}>
          {currentQuestion === placementQuestions.length - 1 ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Chấm điểm
            </>
          ) : (
            "Câu tiếp"
          )}
        </Button>
      </div>
    </div>
  )
}
