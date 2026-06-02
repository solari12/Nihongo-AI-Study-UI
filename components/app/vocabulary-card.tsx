"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Volume2, CheckCircle2, BookmarkPlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n"
import { localizeVocabularyMeaning } from "@/lib/localized-study-content"

interface VocabularyCardProps {
  japanese: string
  hiragana: string
  romaji: string
  vietnamese: string
  type: string
  imageUrl?: string | null
  example?: {
    japanese: string
    hiragana?: string
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

function speakJapanese(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return false
  }

  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = "ja-JP"
  utterance.rate = 0.85
  utterance.pitch = 1

  const voice = window.speechSynthesis.getVoices().find((item) => item.lang.toLowerCase().startsWith("ja"))
  if (voice) utterance.voice = voice

  window.speechSynthesis.speak(utterance)
  return true
}

function buildExampleReading(exampleJapanese: string, japanese: string, hiragana: string, explicitReading?: string) {
  if (explicitReading?.trim()) return explicitReading
  if (!exampleJapanese.includes(japanese)) return ""

  return exampleJapanese.replaceAll(japanese, hiragana)
}

export function VocabularyCard({
  japanese,
  hiragana,
  romaji,
  vietnamese,
  type,
  imageUrl,
  example,
  isLearned = false,
  onListen,
  onMarkLearned,
  onAddToReview,
  className,
}: VocabularyCardProps) {
  const { locale } = useI18n()
  const [speechMessage, setSpeechMessage] = useState("")
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showExampleReading, setShowExampleReading] = useState(false)
  const shouldShowImage = Boolean(imageUrl) && !imageError
  const exampleReading = example
    ? buildExampleReading(example.japanese, japanese, hiragana, example.hiragana)
    : ""
  const localizedMeaning = localizeVocabularyMeaning({
    japanese,
    hiragana,
    romaji,
    meaning: vietnamese,
    locale,
  })

  useEffect(() => {
    setImageLoaded(false)
    setImageError(false)
  }, [imageUrl])

  function handleListen() {
    onListen?.()

    if (speakJapanese(japanese)) {
      setSpeechMessage("")
      return
    }

    setSpeechMessage("Trình duyệt này chưa hỗ trợ đọc giọng nói.")
  }

  return (
    <Card
      className={cn(
        "overflow-hidden border-[#dfb6aa] bg-[#fffdf8]/95 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
        className
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-3xl font-bold tracking-tight text-[#2a211f]">{japanese}</h3>
              {isLearned && <CheckCircle2 className="h-5 w-5 text-[#3f9b68]" />}
            </div>
            <p className="text-lg text-[#8f4742]">{hiragana}</p>
            <p className="text-sm font-medium text-[#6f5952]">{romaji}</p>
          </div>
          <Badge className={cn("shrink-0 rounded-full border-0", typeColors[type] || "bg-[#efe6df] text-[#6f5952]")}>
            {type}
          </Badge>
        </div>

        {shouldShowImage && (
          <div className="relative mt-4 flex h-40 max-h-[180px] items-center justify-center overflow-hidden rounded-lg border border-[#ead0c6] bg-[#fff8f1]">
            {!imageLoaded && <div className="absolute inset-0 animate-pulse bg-[#f0ded5]" />}
            <img
              src={imageUrl ?? ""}
              alt={`${japanese} illustration`}
              className={cn(
                "max-h-full w-full object-contain transition-opacity duration-200",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          </div>
        )}

        <div className="mt-4 rounded-lg border border-[#ead0c6] bg-[#fff8f1]/80 px-4 py-3">
          <p className="text-xl font-semibold leading-7 text-[#2a211f]">{localizedMeaning.primary}</p>
        </div>

        {example && (
          <div className="mt-4 space-y-1 border-l-2 border-[#e58776] pl-3">
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 text-sm font-semibold text-[#2a211f]">{example.japanese}</p>
              {exampleReading && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 shrink-0 rounded-full px-2 text-xs text-[#8f4742] hover:bg-[#fff8f1]"
                  onClick={() => setShowExampleReading((current) => !current)}
                >
                  {showExampleReading ? "Ẩn đọc" : "Cách đọc"}
                </Button>
              )}
            </div>
            {showExampleReading && exampleReading && (
              <p className="text-sm font-medium leading-6 text-[#8f4742]">{exampleReading}</p>
            )}
            <p className="text-sm text-[#6f5952]">{example.vietnamese}</p>
          </div>
        )}

        {speechMessage && <p className="mt-3 text-xs font-medium text-[#8f4742]">{speechMessage}</p>}
      </CardContent>

      <CardFooter className="flex gap-2 border-t border-[#ead0c6] bg-[#f9ece6]/70 p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleListen}
          className="flex-1 rounded-full text-[#702f2a] hover:bg-white/70"
          aria-label={`Nghe phát âm ${japanese}`}
        >
          <Volume2 className="mr-2 h-4 w-4" />
          Nghe
        </Button>
        <Button
          variant={isLearned ? "secondary" : "ghost"}
          size="sm"
          onClick={onMarkLearned}
          className={cn(
            "flex-1 rounded-full",
            isLearned ? "bg-[#dcebd9] text-[#315d41] hover:bg-[#d0e4cd]" : "text-[#702f2a] hover:bg-white/70"
          )}
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
