"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  GraduationCap,
  RotateCcw,
  Volume2,
  XCircle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { readJsonResponse } from "@/lib/http"
import { useI18n } from "@/lib/i18n"
import { localizeVocabularyMeaning } from "@/lib/localized-study-content"
import { getVocabularyExample } from "@/lib/vocabulary-examples"
import { cn } from "@/lib/utils"
import type {
  VocabularyRating,
  VocabularySessionDto,
  VocabularySessionKind,
} from "@/lib/vocabulary/types"

type VocabularySessionClientProps = {
  initialSession: VocabularySessionDto
}

const ratingCopy: Record<VocabularyRating, { label: string; className: string; icon: typeof XCircle }> = {
  forgot: {
    label: "Quên",
    className: "border-[#e2a89b] bg-[#fff4f0] text-[#9f3f33] hover:bg-[#fde8e2]",
    icon: XCircle,
  },
  hard: {
    label: "Khó",
    className: "border-[#dfc28d] bg-[#fff8e8] text-[#8a5c18] hover:bg-[#f8edcf]",
    icon: Brain,
  },
  remembered: {
    label: "Dễ",
    className: "border-[#9ec8a6] bg-[#edf6ea] text-[#315d41] hover:bg-[#dcebd9]",
    icon: CheckCircle2,
  },
}

function speakJapanese(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = "ja-JP"
  utterance.rate = 0.85
  const voice = window.speechSynthesis.getVoices().find((item) => item.lang.toLowerCase().startsWith("ja"))
  if (voice) utterance.voice = voice
  window.speechSynthesis.speak(utterance)
}

async function rateVocabulary(
  sessionId: string,
  vocabularyId: number,
  rating: VocabularyRating
) {
  const response = await fetch(`/api/vocabulary/sessions/${sessionId}/rate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ vocabularyId, rating }),
  })
  return readJsonResponse<{ session: VocabularySessionDto }>(response)
}

async function createNextSession(kind: VocabularySessionKind, topicKey?: string | null) {
  const response = await fetch("/api/vocabulary/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, topicKey: topicKey ?? undefined, limit: 10 }),
  })
  return readJsonResponse<{
    session: VocabularySessionDto | null
    empty: boolean
  }>(response)
}

export function VocabularySessionClient({ initialSession }: VocabularySessionClientProps) {
  const router = useRouter()
  const { locale } = useI18n()
  const [session, setSession] = useState(initialSession)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRating, setLastRating] = useState<VocabularyRating | null>(null)

  const currentItem = session.items[session.currentPosition]
  const isComplete = session.status === "completed" || session.currentPosition >= session.totalItems
  const answeredItems = session.items.filter((item) => item.rating)
  const progressValue = session.totalItems
    ? Math.round((answeredItems.length / session.totalItems) * 100)
    : 0
  const counts = useMemo(
    () => ({
      forgot: session.items.filter((item) => item.rating === "forgot").length,
      hard: session.items.filter((item) => item.rating === "hard").length,
      remembered: session.items.filter((item) => item.rating === "remembered").length,
    }),
    [session.items]
  )
  const nearestDueAt = useMemo(
    () =>
      session.items
        .map((item) => item.dueAt)
        .filter((value): value is string => Boolean(value))
        .sort()[0] ?? null,
    [session.items]
  )

  async function handleRating(rating: VocabularyRating) {
    if (!currentItem || isSaving) return
    setIsSaving(true)
    setError(null)
    setLastRating(rating)
    try {
      const result = await rateVocabulary(session.id, currentItem.vocabulary.id, rating)
      setSession((current) => {
        const nextPosition = Math.max(
          result.session.currentPosition,
          current.currentPosition + 1
        )
        return {
          ...result.session,
          currentPosition: nextPosition,
          status: nextPosition >= result.session.totalItems ? "completed" : result.session.status,
          items: result.session.items.map((item) =>
            item.vocabulary.id === currentItem.vocabulary.id
              ? {
                  ...item,
                  rating,
                  answeredAt: item.answeredAt ?? new Date().toISOString(),
                }
              : item
          ),
        }
      })
      setIsFlipped(false)
      setLastRating(null)
      router.refresh()
    } catch (ratingError) {
      setError(ratingError instanceof Error ? ratingError.message : "Không thể lưu đánh giá.")
    } finally {
      setIsSaving(false)
    }
  }

  async function startNext(kind: VocabularySessionKind) {
    if (isSaving) return
    setIsSaving(true)
    setError(null)
    try {
      const result = await createNextSession(
        kind,
        kind === "topic" ? session.topicKey : undefined
      )
      if (!result.session) {
        router.push("/vocabulary?empty=1")
        return
      }
      router.push(`/vocabulary/session/${result.session.id}`)
      router.refresh()
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Không thể tạo phiên tiếp theo.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isComplete) {
    return (
      <div className="-m-6 min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_8%_12%,rgba(243,200,189,0.55),transparent_28%),linear-gradient(135deg,#fff8f1_0%,#fffdf8_50%,#f7d9d2_100%)] p-6">
        <div className="mx-auto max-w-5xl">
          <Card className="border-[#dfb6aa] bg-[#fffdf8]/95 shadow-sm">
            <CardContent className="space-y-6 p-8">
              <div className="text-center">
                <Badge className="mb-3 rounded-full bg-[#dcebd9] text-[#315d41]">100%</Badge>
                <h1 className="text-3xl font-bold text-[#2a211f]">Hoàn thành phiên từ vựng</h1>
                <p className="mt-2 text-[#6f5952]">Lịch ôn SM-2 đã được cập nhật cho từng từ.</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {(["forgot", "hard", "remembered"] as VocabularyRating[]).map((rating) => (
                  <div key={rating} className={cn("rounded-2xl border p-4 text-center", ratingCopy[rating].className)}>
                    <p className="text-sm">{ratingCopy[rating].label}</p>
                    <p className="text-3xl font-bold">{counts[rating]}</p>
                  </div>
                ))}
              </div>

              {nearestDueAt && (
                <div className="rounded-2xl border border-[#ead0c6] bg-white/70 p-4 text-center text-sm text-[#6f5952]">
                  Lần ôn gần nhất: <strong>{new Date(nearestDueAt).toLocaleDateString("vi-VN")}</strong>
                </div>
              )}

              <div className="grid gap-2 sm:grid-cols-2">
                {session.items.map((item) => (
                  <div key={item.vocabulary.id} className="flex items-center justify-between rounded-2xl border border-[#ead0c6] bg-white/70 px-4 py-3">
                    <div>
                      <p className="font-semibold text-[#2a211f]">{item.vocabulary.japanese}</p>
                      <p className="text-sm text-[#6f5952]">{item.vocabulary.hiragana} · {item.vocabulary.vietnamese}</p>
                    </div>
                    <Badge variant="outline">{item.rating ? ratingCopy[item.rating].label : "—"}</Badge>
                  </div>
                ))}
              </div>

              {error && <p className="text-center text-sm text-destructive">{error}</p>}

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
                <Button
                  className="rounded-full bg-[#702f2a] px-6 text-white hover:bg-[#5d2723]"
                  disabled={isSaving}
                  onClick={() => void startNext(session.kind === "review" ? "review" : "new")}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {session.kind === "review" ? "Ôn phiên tiếp theo" : "Học 10 từ tiếp theo"}
                </Button>
                <Button asChild variant="outline" className="rounded-full border-[#dfb6aa] bg-white/70 px-6">
                  <Link href="/grammar/session/grammar-n5-foundation">
                    <GraduationCap className="mr-2 h-4 w-4" />
                    Học ngữ pháp
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full border-[#dfb6aa] bg-white/70 px-6">
                  <Link href="/learning-path">Quay lại lộ trình</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!currentItem) return null

  const vocabulary = currentItem.vocabulary
  const localizedMeaning = localizeVocabularyMeaning({
    japanese: vocabulary.japanese,
    hiragana: vocabulary.hiragana,
    romaji: vocabulary.romaji,
    meaning: vocabulary.vietnamese,
    locale,
  })
  const example = getVocabularyExample(vocabulary)

  return (
    <div className="-m-6 min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_8%_12%,rgba(243,200,189,0.55),transparent_28%),linear-gradient(135deg,#fff8f1_0%,#fffdf8_50%,#f7d9d2_100%)] p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <header className="rounded-3xl border border-[#dfb6aa] bg-[#fffdf8]/90 p-4 shadow-sm">
          <Link href="/vocabulary" className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-[#702f2a]">
            <ArrowLeft className="h-4 w-4" />
            Quay lại kho từ
          </Link>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#2a211f]">
                {session.kind === "review" ? "Ôn từ đến hạn" : "Phiên học từ vựng"}
              </h1>
              <p className="mt-1 text-sm text-[#6f5952]">
                Từ {session.currentPosition + 1}/{session.totalItems}
              </p>
            </div>
            <div className="w-full md:w-80">
              <div className="mb-1 flex justify-between text-xs text-[#6f5952]">
                <span>{progressValue}%</span>
                <span>{session.totalItems - answeredItems.length} từ còn lại</span>
              </div>
              <Progress value={progressValue} className="h-2" />
            </div>
          </div>
        </header>

        <main className="rounded-3xl border border-[#dfb6aa] bg-[#fffdf8]/85 p-4 shadow-sm md:p-6">
          <button
            type="button"
            className="group mx-auto block h-[430px] w-full max-w-2xl [perspective:1200px]"
            onClick={() => !isSaving && setIsFlipped((current) => !current)}
            aria-label="Lật thẻ để xem nghĩa"
          >
            <div
              className={cn(
                "relative h-full w-full rounded-[2rem] transition-transform duration-500 [transform-style:preserve-3d]",
                isFlipped && "[transform:rotateY(180deg)]"
              )}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[2rem] border border-[#dfb6aa] bg-[#fff8f1] p-8 [backface-visibility:hidden]">
                <p className="text-7xl font-bold text-[#2a211f]">{vocabulary.japanese}</p>
                <p className="mt-5 text-3xl text-[#8f4742]">{vocabulary.hiragana}</p>
                <p className="mt-2 text-lg text-[#6f5952]">{vocabulary.romaji}</p>
                <p className="mt-10 text-sm font-medium text-[#8f4742]">Bấm để xem nghĩa</p>
              </div>

              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[2rem] border border-[#dfb6aa] bg-[#fff8f1] p-8 text-center [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <p className="text-5xl font-bold text-[#2a211f]">{vocabulary.japanese}</p>
                <p className="mt-2 text-xl text-[#8f4742]">{vocabulary.hiragana}</p>
                <div className="my-5 h-px w-full max-w-md bg-[#dfb6aa]" />
                <p className="text-3xl font-bold text-[#2a211f]">{localizedMeaning.primary}</p>
                {example && (
                  <div className="mt-6 max-w-xl space-y-2">
                    <p className="font-semibold text-[#2a211f]">{example.japanese}</p>
                    <p className="text-[#6f5952]">{example.vietnamese}</p>
                  </div>
                )}
              </div>
            </div>
          </button>

          <div className="mx-auto mt-5 grid w-full max-w-2xl gap-3 sm:grid-cols-4">
            <Button
              variant="outline"
              className="rounded-full border-[#dfb6aa] bg-white/70"
              disabled={isSaving}
              onClick={() => speakJapanese(vocabulary.japanese)}
            >
              <Volume2 className="mr-2 h-4 w-4" />
              Nghe
            </Button>
            {(["forgot", "hard", "remembered"] as VocabularyRating[]).map((rating) => {
              const config = ratingCopy[rating]
              const Icon = config.icon
              return (
                <Button
                  key={rating}
                  variant="outline"
                  className={cn("rounded-full", config.className)}
                  disabled={isSaving}
                  onClick={() => void handleRating(rating)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {isSaving && lastRating === rating ? "Đang lưu..." : config.label}
                </Button>
              )
            })}
          </div>

          {!isFlipped && (
            <p className="mt-3 text-center text-xs font-medium text-[#8f4742]">
              Nhấn vào thẻ để xem đáp án nếu cần, hoặc tự đánh giá luôn bằng Quên, Khó, Dễ.
            </p>
          )}
          {error && (
            <div className="mx-auto mt-4 flex max-w-2xl items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <span>{error}</span>
              {lastRating && (
                <Button size="sm" variant="outline" onClick={() => void handleRating(lastRating)}>
                  Thử lại
                </Button>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
