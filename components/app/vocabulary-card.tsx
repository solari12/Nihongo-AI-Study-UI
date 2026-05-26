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
  "Danh từ": "bg-blue-100 text-blue-700",
  "Động từ": "bg-green-100 text-green-700",
  "Tính từ": "bg-orange-100 text-orange-700",
  "Trạng từ": "bg-purple-100 text-purple-700",
  "Phó từ": "bg-pink-100 text-pink-700",
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
    <Card className={cn("overflow-hidden transition-shadow hover:shadow-md", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-bold">{japanese}</h3>
              {isLearned && (
                <CheckCircle2 className="h-5 w-5 text-success" />
              )}
            </div>
            <p className="text-lg text-muted-foreground">{hiragana}</p>
            <p className="text-sm text-muted-foreground">{romaji}</p>
          </div>
          <Badge className={cn("shrink-0", typeColors[type] || "bg-gray-100 text-gray-700")}>
            {type}
          </Badge>
        </div>

        <div className="mt-4 rounded-lg bg-muted/50 p-3">
          <p className="text-lg font-medium text-foreground">{vietnamese}</p>
        </div>

        {example && (
          <div className="mt-4 space-y-1 border-l-2 border-primary/30 pl-3">
            <p className="text-sm font-medium">{example.japanese}</p>
            <p className="text-sm text-muted-foreground">{example.vietnamese}</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2 border-t bg-muted/30 p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onListen}
          className="flex-1"
        >
          <Volume2 className="mr-2 h-4 w-4" />
          Nghe
        </Button>
        <Button
          variant={isLearned ? "secondary" : "ghost"}
          size="sm"
          onClick={onMarkLearned}
          className="flex-1"
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          {isLearned ? "Đã học" : "Đánh dấu"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddToReview}
          className="flex-1"
        >
          <BookmarkPlus className="mr-2 h-4 w-4" />
          Ôn tập
        </Button>
      </CardFooter>
    </Card>
  )
}
