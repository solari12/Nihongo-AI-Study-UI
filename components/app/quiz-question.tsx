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
        ? "border-primary bg-primary/5 ring-2 ring-primary"
        : "border-border hover:border-primary/50 hover:bg-muted/50"
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
      {/* Progress header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
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

      {/* Question */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold leading-relaxed">{question}</h2>
        </CardContent>
      </Card>

      {/* Answers */}
      <div className="grid gap-3">
        {answers.map((answer, index) => (
          <button
            key={answer.id}
            onClick={() => !showResult && onSelectAnswer(answer.id)}
            disabled={showResult}
            className={cn(
              "flex items-center gap-4 rounded-lg border-2 p-4 text-left transition-all",
              getAnswerStyle(answer.id),
              !showResult && "cursor-pointer"
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 font-medium",
                selectedAnswer === answer.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/30"
              )}
            >
              {String.fromCharCode(65 + index)}
            </span>
            <span className="text-base">{answer.text}</span>
          </button>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={!canGoPrevious}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Câu trước
        </Button>
        <Button onClick={onNext} disabled={!canGoNext}>
          {questionNumber === totalQuestions ? "Hoàn thành" : "Câu tiếp"}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
