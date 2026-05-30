"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Clock } from "lucide-react"

interface QuizQuestionProps {
  questionNumber: number
  totalQuestions: number
  question: string
  answers: {
    id: string
    text: string
  }[]
  selectedAnswer?: string
  correctAnswer?: string
  showResult?: boolean
  timeLeft?: number
  totalTime?: number
  onSelectAnswer: (answerId: string) => void
  onPrevious?: () => void
  onNext?: () => void
  canGoPrevious?: boolean
  canGoNext?: boolean
}

export function QuizQuestion({
  questionNumber,
  totalQuestions,
  question,
  answers,
  selectedAnswer,
  correctAnswer,
  showResult = false,
  timeLeft,
  totalTime = 30,
  onSelectAnswer,
  onPrevious,
  onNext,
  canGoPrevious = true,
  canGoNext = true,
}: QuizQuestionProps) {
  const progress = (questionNumber / totalQuestions) * 100
  const timeProgress = timeLeft !== undefined ? (timeLeft / totalTime) * 100 : 100

  const getAnswerStyle = (answerId: string) => {
    if (!showResult) {
      return selectedAnswer === answerId
        ? "border-[#702f2a] bg-[#f4d8d1]/55 ring-2 ring-[#702f2a]/25"
        : "border-[#dfb6aa] hover:border-[#8f4742] hover:bg-[#fff8f1]"
    }

    if (answerId === correctAnswer) {
      return "border-success bg-success/10 text-success-foreground"
    }

    if (selectedAnswer === answerId && answerId !== correctAnswer) {
      return "border-destructive bg-destructive/10 text-destructive"
    }

    return "border-border opacity-50"
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-3 rounded-xl border border-[#dfb6aa] bg-[#fffdf8]/90 p-4 shadow-sm">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-[#702f2a]">
            Câu {questionNumber} / {totalQuestions}
          </span>
          {timeLeft !== undefined && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className={cn(timeLeft <= 10 && "text-destructive font-medium")}>
                {timeLeft}s
              </span>
            </div>
          )}
        </div>
        <Progress value={progress} className="h-2" />
        {timeLeft !== undefined && (
          <Progress
            value={timeProgress}
            className={cn(
              "h-1",
              timeLeft <= 10 && "[&>div]:bg-destructive"
            )}
          />
        )}
      </div>

      <Card className="border-[#dfb6aa] bg-[#fffdf8]/95 shadow-sm">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold leading-relaxed text-[#2a211f]">{question}</h2>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {answers.map((answer, index) => (
          <button
            key={answer.id}
            onClick={() => !showResult && onSelectAnswer(answer.id)}
            disabled={showResult}
            className={cn(
              "flex items-center gap-4 rounded-xl border-2 bg-[#fffdf8]/85 p-4 text-left shadow-sm transition-all",
              getAnswerStyle(answer.id),
              !showResult && "cursor-pointer"
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 font-medium",
                selectedAnswer === answer.id
                  ? "border-[#702f2a] bg-[#702f2a] text-white"
                  : "border-[#dfb6aa] text-[#8f4742]"
              )}
            >
              {String.fromCharCode(65 + index)}
            </span>
            <span className="text-base">{answer.text}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className="rounded-full border-[#dfb6aa] bg-white/70 text-[#702f2a] hover:bg-white"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Câu trước
        </Button>
        <Button onClick={onNext} disabled={!canGoNext} className="rounded-full bg-[#702f2a] text-white hover:bg-[#5d2723]">
          {questionNumber === totalQuestions ? "Hoàn thành" : "Câu tiếp"}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
