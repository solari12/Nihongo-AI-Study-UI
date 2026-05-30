"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Volume2, CheckCircle2, BookmarkPlus } from "lucide-react"
import { cn } from "@/lib/utils"

interface VocabularyCardProps {
  japanese: string
  hiragana: string
  romaji: string
  vietnamese: string
  type: string
  example?: {
    japanese: string
    vietnamese: string
  }
  isLearned?: boolean
  onListen?: () => void
  onMarkLearned?: () => void
  onAddToReview?: () => void
  className?: string
}

const typeColors: Record<string, string> = {
  "Danh từ": "bg-[#f4d8d1] text-[#702f2a]",
  "Động từ": "bg-[#dcebd9] text-[#315d41]",
  "Tính từ": "bg-[#f2dfc8] text-[#6b4325]",
  "Trạng từ": "bg-[#e7ddea] text-[#56375d]",
  "Phó từ": "bg-[#f5d7df] text-[#733145]",
}

export function VocabularyCard({
  japanese,
  hiragana,
  romaji,
  vietnamese,
  type,
  example,
  isLearned = false,
  onListen,
  onMarkLearned,
  onAddToReview,
  className,
}: VocabularyCardProps) {
  return (
    <Card className={cn("overflow-hidden border-[#dfb6aa] bg-[#fffdf8]/95 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-3xl font-bold tracking-tight text-[#2a211f]">{japanese}</h3>
              {isLearned && (
                <CheckCircle2 className="h-5 w-5 text-[#3f9b68]" />
              )}
            </div>
            <p className="text-lg text-[#8f4742]">{hiragana}</p>
            <p className="text-sm font-medium text-[#6f5952]">{romaji}</p>
          </div>
          <Badge className={cn("shrink-0 rounded-full border-0", typeColors[type] || "bg-[#efe6df] text-[#6f5952]")}>
            {type}
          </Badge>
        </div>

        <div className="mt-4 rounded-lg border border-[#ead0c6] bg-[#fff8f1]/80 p-3">
          <p className="text-lg font-semibold text-[#2a211f]">{vietnamese}</p>
        </div>

        {example && (
          <div className="mt-4 space-y-1 border-l-2 border-[#e58776] pl-3">
            <p className="text-sm font-semibold text-[#2a211f]">{example.japanese}</p>
            <p className="text-sm text-[#6f5952]">{example.vietnamese}</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2 border-t border-[#ead0c6] bg-[#f9ece6]/70 p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onListen}
          className="flex-1 rounded-full text-[#702f2a] hover:bg-white/70"
        >
          <Volume2 className="mr-2 h-4 w-4" />
          Nghe
        </Button>
        <Button
          variant={isLearned ? "secondary" : "ghost"}
          size="sm"
          onClick={onMarkLearned}
          className={cn("flex-1 rounded-full", isLearned ? "bg-[#dcebd9] text-[#315d41] hover:bg-[#d0e4cd]" : "text-[#702f2a] hover:bg-white/70")}
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          {isLearned ? "Đã học" : "Đánh dấu"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddToReview}
          className="flex-1 rounded-full text-[#702f2a] hover:bg-white/70"
        >
          <BookmarkPlus className="mr-2 h-4 w-4" />
          Ôn tập
        </Button>
      </CardFooter>
    </Card>
  )
}
