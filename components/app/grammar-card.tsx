"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, PlayCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface GrammarCardProps {
  pattern: string
  meaning: string
  structure: string
  example: {
    japanese: string
    vietnamese: string
  }
  usageNote?: string
  difficulty: "Dễ" | "Trung bình" | "Khó"
  status: "Chưa học" | "Đang học" | "Đã hoàn thành"
  onLearn?: () => void
  onAskAI?: () => void
  className?: string
}

const difficultyColors: Record<string, string> = {
  "Dễ": "bg-green-100 text-green-700",
  "Trung bình": "bg-orange-100 text-orange-700",
  "Khó": "bg-red-100 text-red-700",
}

const statusColors: Record<string, string> = {
  "Chưa học": "bg-gray-100 text-gray-700",
  "Đang học": "bg-blue-100 text-blue-700",
  "Đã hoàn thành": "bg-green-100 text-green-700",
}

export function GrammarCard({
  pattern,
  meaning,
  structure,
  example,
  usageNote,
  difficulty,
  status,
  onLearn,
  onAskAI,
  className,
}: GrammarCardProps) {
  return (
    <Card className={cn("overflow-hidden transition-shadow hover:shadow-md", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-primary">{pattern}</h3>
            <p className="text-muted-foreground">{meaning}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={cn(difficultyColors[difficulty])}>
              {difficulty}
            </Badge>
            <Badge variant="outline" className={cn(statusColors[status])}>
              {status}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-sm font-medium text-muted-foreground">Cấu trúc</p>
          <p className="mt-1 font-mono text-sm">{structure}</p>
        </div>

        <div className="space-y-1 border-l-2 border-primary/30 pl-3">
          <p className="font-medium">{example.japanese}</p>
          <p className="text-sm text-muted-foreground">{example.vietnamese}</p>
        </div>

        {usageNote && (
          <div className="rounded-lg bg-accent/10 p-3">
            <p className="text-sm">
              <span className="font-medium text-accent-foreground">💡 Lưu ý: </span>
              {usageNote}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2 border-t bg-muted/30 p-3">
        <Button onClick={onLearn} className="flex-1">
          <PlayCircle className="mr-2 h-4 w-4" />
          Học ngay
        </Button>
        <Button variant="outline" onClick={onAskAI} className="flex-1">
          <MessageSquare className="mr-2 h-4 w-4" />
          Hỏi AI
        </Button>
      </CardFooter>
    </Card>
  )
}
