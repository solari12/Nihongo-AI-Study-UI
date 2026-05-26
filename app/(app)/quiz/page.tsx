"use client"

import { useState } from "react"
import { QuizQuestion } from "@/components/app/quiz-question"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

type QuizState = "setup" | "playing" | "result"

const quizQuestions = [
  {
    id: 1,
    question: '"学生" nghĩa là gì?',
    answers: [
      { id: "a", text: "Giáo viên" },
      { id: "b", text: "Sinh viên" },
      { id: "c", text: "Sách" },
      { id: "d", text: "Nhật Bản" },
    ],
    correctAnswer: "b",
    explanation: "学生 (がくせい / gakusei) có nghĩa là sinh viên.",
  },
  {
    id: 2,
    question: 'Chọn cách đọc đúng của "先生"',
    answers: [
      { id: "a", text: "sakisei" },
      { id: "b", text: "sensei" },
      { id: "c", text: "seisei" },
      { id: "d", text: "sensou" },
    ],
    correctAnswer: "b",
    explanation: "先生 đọc là せんせい (sensei), có nghĩa là giáo viên.",
  },
  {
    id: 3,
    question: 'Điền vào chỗ trống: "私___学生です。"',
    answers: [
      { id: "a", text: "を" },
      { id: "b", text: "が" },
      { id: "c", text: "は" },
      { id: "d", text: "に" },
    ],
    correctAnswer: "c",
    explanation: 'Trợ từ は dùng để đánh dấu chủ đề của câu. "私は学生です" nghĩa là "Tôi là sinh viên".',
  },
  {
    id: 4,
    question: '"水" nghĩa là gì?',
    answers: [
      { id: "a", text: "Lửa" },
      { id: "b", text: "Đất" },
      { id: "c", text: "Gió" },
      { id: "d", text: "Nước" },
    ],
    correctAnswer: "d",
    explanation: "水 (みず / mizu) có nghĩa là nước.",
  },
  {
    id: 5,
    question: 'Câu nào đúng để nói "Đây là sách"?',
    answers: [
      { id: "a", text: "これは本です。" },
      { id: "b", text: "それは本です。" },
      { id: "c", text: "あれは本です。" },
      { id: "d", text: "どれは本です。" },
    ],
    correctAnswer: "a",
    explanation: 'これ dùng cho vật ở gần người nói. "これは本です" = "Cái này là sách".',
  },
]

export default function QuizPage() {
  const [quizState, setQuizState] = useState<QuizState>("setup")
  const [quizType, setQuizType] = useState("vocabulary")
  const [questionCount, setQuestionCount] = useState("5")
  const [difficulty, setDifficulty] = useState("easy")
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({})
  const [showResult, setShowResult] = useState(false)

  const startQuiz = () => {
    setQuizState("playing")
    setCurrentQuestion(0)
    setSelectedAnswers({})
    setShowResult(false)
  }

  const handleSelectAnswer = (answerId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion]: answerId,
    }))
  }

  const handleNext = () => {
    if (currentQuestion === quizQuestions.length - 1) {
      setShowResult(true)
      setQuizState("result")
    } else {
      setCurrentQuestion((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1)
    }
  }

  const calculateScore = () => {
    let correct = 0
    quizQuestions.forEach((q, index) => {
      if (selectedAnswers[index] === q.correctAnswer) {
        correct++
      }
    })
    return correct
  }

  if (quizState === "setup") {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Quiz N5</h1>
          <p className="text-muted-foreground">
            Kiểm tra kiến thức tiếng Nhật của bạn
          </p>
        </div>

        {/* Quiz setup */}
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Thiết lập bài kiểm tra</CardTitle>
              <CardDescription>
                Chọn loại quiz và số lượng câu hỏi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quiz type */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Loại quiz</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "vocabulary", label: "Từ vựng", icon: BookOpen },
                    { value: "grammar", label: "Ngữ pháp", icon: FileText },
                    { value: "mixed", label: "Tổng hợp", icon: Shuffle },
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setQuizType(type.value)}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
                        quizType === type.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <type.icon className={cn(
                        "h-6 w-6",
                        quizType === type.value ? "text-primary" : "text-muted-foreground"
                      )} />
                      <span className="text-sm font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question count */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Số câu hỏi</label>
                <Select value={questionCount} onValueChange={setQuestionCount}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 câu</SelectItem>
                    <SelectItem value="10">10 câu</SelectItem>
                    <SelectItem value="20">20 câu</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Difficulty */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Độ khó</label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Dễ</SelectItem>
                    <SelectItem value="medium">Trung bình</SelectItem>
                    <SelectItem value="hard">Khó</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={startQuiz} className="w-full" size="lg">
                <PlayCircle className="mr-2 h-5 w-5" />
                Bắt đầu làm quiz
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (quizState === "result") {
    const score = calculateScore()
    const total = quizQuestions.length
    const percentage = Math.round((score / total) * 100)

    return (
      <div className="space-y-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Score card */}
          <Card className="text-center">
            <CardContent className="pt-8 pb-6">
              <div className="mb-6">
                <Trophy className={cn(
                  "mx-auto h-16 w-16",
                  percentage >= 80 ? "text-yellow-500" : percentage >= 60 ? "text-gray-400" : "text-orange-400"
                )} />
              </div>
              <h2 className="text-3xl font-bold mb-2">Kết quả</h2>
              <div className="text-6xl font-bold text-primary mb-4">
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
            </CardContent>
          </Card>

          {/* Explanations */}
          <Card>
            <CardHeader>
              <CardTitle>Chi tiết câu trả lời</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {quizQuestions.map((q, index) => {
                const isCorrect = selectedAnswers[index] === q.correctAnswer
                return (
                  <div
                    key={q.id}
                    className={cn(
                      "rounded-lg border p-4",
                      isCorrect ? "border-success/50 bg-success/5" : "border-destructive/50 bg-destructive/5"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-2">
                        <p className="font-medium">Câu {index + 1}: {q.question}</p>
                        <p className="text-sm text-muted-foreground">
                          Đáp án đúng: {q.answers.find(a => a.id === q.correctAnswer)?.text}
                        </p>
                        <p className="text-sm">{q.explanation}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setQuizState("setup")}
            >
              <Home className="mr-2 h-4 w-4" />
              Về trang quiz
            </Button>
            <Button className="flex-1" onClick={startQuiz}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Làm lại
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Playing state
  return (
    <div className="space-y-6">
      <QuizQuestion
        questionNumber={currentQuestion + 1}
        totalQuestions={quizQuestions.length}
        question={quizQuestions[currentQuestion].question}
        answers={quizQuestions[currentQuestion].answers}
        selectedAnswer={selectedAnswers[currentQuestion]}
        onSelectAnswer={handleSelectAnswer}
        onPrevious={handlePrevious}
        onNext={handleNext}
        canGoPrevious={currentQuestion > 0}
        canGoNext={selectedAnswers[currentQuestion] !== undefined}
      />
    </div>
  )
}
