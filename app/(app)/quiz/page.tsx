"use client"

import Image from "next/image"
import { useMemo, useState } from "react"
import { QuizQuestion } from "@/components/app/quiz-question"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BookOpen,
  FileText,
  Shuffle,
  PlayCircle,
  Trophy,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Home,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { readJsonResponse } from "@/lib/http"
import type { QuizQuestionItem } from "@/lib/data/nihongo-study"
import { useStudyProgress } from "@/hooks/use-study-progress"
import { useAdminContent } from "@/hooks/use-admin-content"
import { useActivityLog } from "@/hooks/use-activity-log"
import { ContentErrorAlert } from "@/components/app/content-state"

type QuizState = "setup" | "playing" | "result"

type SubmitQuizResponse = {
  score: number
  total: number
  percentage: number
}

const paperCardStyle = {
  backgroundColor: "transparent",
  backgroundImage: "url('/assets/paper-card-bg-clean.png')",
  backgroundRepeat: "no-repeat",
  backgroundSize: "100% 100%",
  backgroundPosition: "center",
} as const

export default function QuizPage() {
  const [quizState, setQuizState] = useState<QuizState>("setup")
  const [quizType, setQuizType] = useState("vocabulary")
  const [questionCount, setQuestionCount] = useState("5")
  const [difficulty, setDifficulty] = useState("easy")
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({})
  const [finalResult, setFinalResult] = useState({ score: 0, total: 0, percentage: 0 })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { recordQuizAttempt } = useStudyProgress()
  const { content, isLoaded, error } = useAdminContent()
  const { addActivity } = useActivityLog()

  const activeQuestions = useMemo(() => {
    const filtered = content.quiz.filter((question) => {
      const matchesType = quizType === "mixed" || question.type === quizType
      const matchesDifficulty = difficulty === "easy" || question.difficulty === difficulty
      return matchesType && matchesDifficulty
    })

    return filtered.slice(0, Number(questionCount))
  }, [content.quiz, difficulty, questionCount, quizType])

  const startQuiz = () => {
    setQuizState("playing")
    setCurrentQuestion(0)
    setSelectedAnswers({})
    setFinalResult({ score: 0, total: activeQuestions.length, percentage: 0 })
  }

  const handleSelectAnswer = (answerId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion]: answerId,
    }))
  }

  const submitQuiz = async () => {
    setIsSubmitting(true)

    const answersByQuestionId = activeQuestions.reduce<Record<string, string>>(
      (answers, question, index) => {
        answers[String(question.id)] = selectedAnswers[index]
        return answers
      },
      {}
    )

    try {
      const response = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quizType,
          questionIds: activeQuestions.map((question) => question.id),
          answers: answersByQuestionId,
        }),
      })
      const result = await readJsonResponse<SubmitQuizResponse>(response)

      setFinalResult(result)
      recordQuizAttempt(quizType, result)
      addActivity({
        type: "quiz",
        content: `Hoàn thành quiz ${quizType === "vocabulary" ? "từ vựng" : quizType === "grammar" ? "ngữ pháp" : "tổng hợp"}`,
        topic: activeQuestions[0]?.topic,
        result: `${result.score}/${result.total} câu đúng`,
        score: result.percentage,
        durationMinutes: 12,
      })
      setQuizState("result")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNext = () => {
    if (currentQuestion === activeQuestions.length - 1) {
      void submitQuiz()
    } else {
      setCurrentQuestion((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1)
    }
  }

  if (quizState === "setup") {
    return (
      <div className="-m-6 min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_8%_12%,rgba(243,200,189,0.55),transparent_28%),linear-gradient(135deg,#fff8f1_0%,#fffdf8_50%,#f7d9d2_100%)] p-6">
        <div className="space-y-6">
          <section className="relative overflow-hidden rounded-xl bg-[#fff8f1]/85 px-6 py-5">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px] md:items-center">
              <div className="relative max-w-2xl">
                <h1 className="text-3xl font-bold tracking-tight text-[#2a211f]">Quiz N5</h1>
                <p className="mt-2 text-base leading-7 text-[#4f403b]">
                  Chọn dạng bài, số câu và độ khó để kiểm tra nhanh phần đã học.
                </p>
              </div>
              <div className="hidden h-40 items-center justify-center md:flex">
                <Image
                  src="/assets/quiz-card-clean.png"
                  alt=""
                  width={260}
                  height={220}
                  aria-hidden="true"
                  className="h-40 w-48 object-contain drop-shadow-[0_10px_18px_rgba(143,71,66,0.18)]"
                />
              </div>
            </div>
          </section>

          {error && <ContentErrorAlert message={error} />}

        <div className="mx-auto max-w-2xl">
          <section
            className="rounded-xl px-8 py-8 sm:px-10 sm:py-10"
            style={paperCardStyle}
          >
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-[#2a211f]">Thiết lập bài kiểm tra</h2>
              <p className="text-sm leading-6 text-[#6f5952]">
                Chọn loại quiz và số lượng câu hỏi
              </p>
            </div>
            <div className="mt-6 space-y-5">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-[#2a211f]">Loại quiz</label>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { value: "vocabulary", label: "Từ vựng", icon: BookOpen },
                    { value: "grammar", label: "Ngữ pháp", icon: FileText },
                    { value: "mixed", label: "Tổng hợp", icon: Shuffle },
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setQuizType(type.value)}
                      className={cn(
                        "flex min-h-20 items-center gap-3 rounded-xl border-2 bg-white/55 p-3 text-left transition-all sm:flex-col sm:justify-center sm:text-center",
                        quizType === type.value
                          ? "border-[#702f2a] bg-[#f4d8d1]/55"
                          : "border-[#dfb6aa] hover:border-[#8f4742]"
                      )}
                    >
                      <type.icon className={cn(
                        "h-6 w-6",
                        quizType === type.value ? "text-[#702f2a]" : "text-[#8f4742]"
                      )} />
                      <span className="text-sm font-medium leading-5">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-[#2a211f]">Số câu hỏi</label>
                <Select value={questionCount} onValueChange={setQuestionCount}>
                  <SelectTrigger className="border-[#dfb6aa] bg-white/70">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 câu</SelectItem>
                    <SelectItem value="10">10 câu</SelectItem>
                    <SelectItem value="20">20 câu</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-[#2a211f]">Độ khó</label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger className="border-[#dfb6aa] bg-white/70">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Dễ</SelectItem>
                    <SelectItem value="medium">Trung bình</SelectItem>
                    <SelectItem value="hard">Khó</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={startQuiz}
                className="w-full rounded-full bg-[#702f2a] text-white hover:bg-[#5d2723]"
                size="lg"
                disabled={!isLoaded || activeQuestions.length === 0}
              >
                <PlayCircle className="mr-2 h-5 w-5" />
                Bắt đầu làm quiz
              </Button>
              {!isLoaded && (
                <p className="text-center text-sm text-muted-foreground">
                  Đang tải câu hỏi từ PostgreSQL...
                </p>
              )}
              {isLoaded && activeQuestions.length === 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  Chưa có câu hỏi phù hợp với lựa chọn này.
                </p>
              )}
            </div>
          </section>
        </div>
        </div>
      </div>
    )
  }

  if (quizState === "result") {
    const { score, total, percentage } = finalResult

    return (
      <div className="-m-6 min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_8%_12%,rgba(243,200,189,0.55),transparent_28%),linear-gradient(135deg,#fff8f1_0%,#fffdf8_50%,#f7d9d2_100%)] p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <Card className="border-none bg-transparent text-center shadow-none" style={paperCardStyle}>
            <CardContent className="pt-8 pb-6">
              <div className="mb-6">
                <Trophy className={cn(
                  "mx-auto h-16 w-16",
                  percentage >= 80 ? "text-yellow-500" : percentage >= 60 ? "text-gray-400" : "text-orange-400"
                )} />
              </div>
              <h2 className="mb-2 text-3xl font-bold">Kết quả</h2>
              <div className="mb-4 text-6xl font-bold text-[#702f2a]">
                {percentage}%
              </div>
              <div className="flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <span>{score} câu đúng</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-destructive" />
                  <span>{total - score} câu sai</span>
                </div>
              </div>
              <Progress value={percentage} className="mt-6 h-2" />
            </CardContent>
          </Card>

          <Card className="border-[#dfb6aa] bg-[#fffdf8]/95 shadow-sm">
            <CardHeader>
              <CardTitle>Chi tiết câu trả lời</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeQuestions.map((question, index) => {
                const isCorrect = selectedAnswers[index] === question.correctAnswer
                return (
                  <div
                    key={question.id}
                    className={cn(
                      "rounded-xl border p-4",
                      isCorrect ? "border-[#9cc8aa] bg-[#dcebd9]/60" : "border-[#e3a8a0] bg-[#f4d8d1]/55"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-2">
                        <p className="font-medium">Câu {index + 1}: {question.question}</p>
                        <p className="text-sm text-muted-foreground">
                          Đáp án đúng: {question.answers.find((answer) => answer.id === question.correctAnswer)?.text}
                        </p>
                        <p className="text-sm">{question.explanation}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1 rounded-full border-[#dfb6aa] bg-white/70 text-[#702f2a] hover:bg-white"
              onClick={() => setQuizState("setup")}
            >
              <Home className="mr-2 h-4 w-4" />
              Về trang quiz
            </Button>
            <Button className="flex-1 rounded-full bg-[#702f2a] text-white hover:bg-[#5d2723]" onClick={startQuiz}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Làm lại
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const question = activeQuestions[currentQuestion]

  return (
    <div className="-m-6 min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_8%_12%,rgba(243,200,189,0.55),transparent_28%),linear-gradient(135deg,#fff8f1_0%,#fffdf8_50%,#f7d9d2_100%)] p-6">
      <QuizQuestion
        questionNumber={currentQuestion + 1}
        totalQuestions={activeQuestions.length}
        question={question.question}
        answers={question.answers}
        selectedAnswer={selectedAnswers[currentQuestion]}
        onSelectAnswer={handleSelectAnswer}
        onPrevious={handlePrevious}
        onNext={handleNext}
        canGoPrevious={currentQuestion > 0}
        canGoNext={selectedAnswers[currentQuestion] !== undefined && !isSubmitting}
      />
    </div>
  )
}
