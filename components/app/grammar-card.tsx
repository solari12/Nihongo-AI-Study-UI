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
  "Dễ": "bg-[#dcebd9] text-[#315d41]",
  "Trung bình": "bg-[#f2dfc8] text-[#6b4325]",
  "Khó": "bg-[#f4d8d1] text-[#702f2a]",
}

const statusColors: Record<string, string> = {
  "Chưa học": "bg-[#efe6df] text-[#6f5952]",
  "Đang học": "bg-[#f4d8d1] text-[#702f2a]",
  "Đã hoàn thành": "bg-[#dcebd9] text-[#315d41]",
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
    <Card className={cn("overflow-hidden border-[#dfb6aa] bg-[#fffdf8]/95 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-[#702f2a]">{pattern}</h3>
            <p className="font-medium text-[#6f5952]">{meaning}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={cn("rounded-full border-0", difficultyColors[difficulty])}>
              {difficulty}
            </Badge>
            <Badge variant="outline" className={cn("rounded-full border-0", statusColors[status])}>
              {status}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-lg border border-[#ead0c6] bg-[#fff8f1]/80 p-3">
          <p className="text-sm font-semibold text-[#8f4742]">Cấu trúc</p>
          <p className="mt-1 font-mono text-sm text-[#2a211f]">{structure}</p>
        </div>

        <div className="space-y-1 border-l-2 border-[#e58776] pl-3">
          <p className="font-semibold text-[#2a211f]">{example.japanese}</p>
          <p className="text-sm text-[#6f5952]">{example.vietnamese}</p>
        </div>

        {usageNote && (
          <div className="rounded-lg bg-[#f4d8d1]/55 p-3">
            <p className="text-sm text-[#4f403b]">
              <span className="font-semibold text-[#702f2a]">Lưu ý: </span>
              {usageNote}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2 border-t border-[#ead0c6] bg-[#f9ece6]/70 p-3">
        <Button onClick={onLearn} className="flex-1 rounded-full bg-[#702f2a] text-white hover:bg-[#5d2723]">
          <PlayCircle className="mr-2 h-4 w-4" />
          Học ngay
        </Button>
        <Button variant="outline" onClick={onAskAI} className="flex-1 rounded-full border-[#dfb6aa] bg-white/60 text-[#702f2a] hover:bg-white">
          <MessageSquare className="mr-2 h-4 w-4" />
          Hỏi AI
        </Button>
      </CardFooter>
    </Card>
  )
}
