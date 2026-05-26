"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle, PlayCircle, Clock } from "lucide-react"

interface LearningStep {
  id: string
  title: string
  type: "vocabulary" | "grammar" | "quiz" | "review"
  status: "completed" | "current" | "upcoming"
  reason?: string
  estimatedTime?: string
}

interface LearningPathTimelineProps {
  steps: LearningStep[]
  onStartStep?: (stepId: string) => void
}

const typeLabels: Record<string, string> = {
  vocabulary: "Từ vựng",
  grammar: "Ngữ pháp",
  quiz: "Kiểm tra",
  review: "Ôn tập",
}

const typeColors: Record<string, string> = {
  vocabulary: "bg-blue-100 text-blue-700",
  grammar: "bg-green-100 text-green-700",
  quiz: "bg-orange-100 text-orange-700",
  review: "bg-purple-100 text-purple-700",
}

export function LearningPathTimeline({
  steps,
  onStartStep,
}: LearningPathTimelineProps) {
  return (
    <div className="relative space-y-0">
      {steps.map((step, index) => {
        const isCompleted = step.status === "completed"
        const isCurrent = step.status === "current"
        const isLast = index === steps.length - 1

        return (
          <div key={step.id} className="relative flex gap-4 pb-8">
            {/* Timeline line */}
            {!isLast && (
              <div
                className={cn(
                  "absolute left-4 top-8 h-full w-0.5 -translate-x-1/2",
                  isCompleted ? "bg-success" : "bg-border"
                )}
              />
            )}

            {/* Status icon */}
            <div className="relative z-10 shrink-0">
              {isCompleted ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success text-success-foreground">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              ) : isCurrent ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground ring-4 ring-primary/20">
                  <PlayCircle className="h-5 w-5" />
                </div>
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-border bg-background">
                  <Circle className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Content */}
            <div
              className={cn(
                "flex-1 rounded-lg border p-4 transition-all",
                isCurrent ? "border-primary bg-primary/5 shadow-sm" : "bg-card",
                isCompleted && "opacity-70"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{step.title}</h4>
                    <Badge className={cn("text-xs", typeColors[step.type])}>
                      {typeLabels[step.type]}
                    </Badge>
                  </div>
                  {step.reason && (
                    <p className="text-sm text-muted-foreground">
                      💡 {step.reason}
                    </p>
                  )}
                  {step.estimatedTime && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {step.estimatedTime}
                    </div>
                  )}
                </div>

                {isCurrent && (
                  <Button
                    size="sm"
                    onClick={() => onStartStep?.(step.id)}
                  >
                    Bắt đầu học
                  </Button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
