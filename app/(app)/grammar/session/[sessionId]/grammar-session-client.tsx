"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useActivityLog } from "@/hooks/use-activity-log"
import { useI18n, type Locale } from "@/lib/i18n"
import { localizeGrammarContent } from "@/lib/localized-study-content"
import { resolveGrammarSession } from "@/lib/grammar/session-config"
import { cn } from "@/lib/utils"
import type { GrammarItem } from "@/lib/data/nihongo-study"

type AnswerStatus = "understood" | "review"

type GrammarSessionClientProps = {
  sessionId: string
  grammarItems: GrammarItem[]
}

const copy = {
  vi: {
    back: "Quay lại lộ trình",
    todayItems: "mẫu hôm nay",
    completed: "hoàn thành",
    minutes: "phút",
    tapForDetail: "Bấm để xem ví dụ",
    structure: "Cấu trúc",
    example: "Ví dụ",
    note: "Lưu ý",
    understood: "Đã hiểu",
    notSure: "Cần ôn",
    sessionToday: "Phiên học hôm nay",
    understoodCount: "Đã hiểu",
    reviewCount: "Cần ôn",
    remaining: "Còn lại",
    dailyProgress: "Tiến độ ngày hôm nay",
    vocabulary: "Từ vựng",
    grammar: "Ngữ pháp",
    review: "Ôn tập",
    completeTitle: "Hoàn thành phiên ngữ pháp",
    continuePath: "Quay lại lộ trình",
    restart: "Làm lại phiên này",
    fallbackTitle: "Không tìm thấy phiên ngữ pháp này",
    fallbackBody: "Bạn có thể quay lại lộ trình hoặc học phiên ngữ pháp nền tảng.",
    viLabel: "VI",
  },
  ja: {
    back: "学習ルートへ戻る",
    todayItems: "今日の文法",
    completed: "完了",
    minutes: "分",
    tapForDetail: "例文を見る",
    structure: "構造",
    example: "例文",
    note: "メモ",
    understood: "理解した",
    notSure: "復習する",
    sessionToday: "今日の学習",
    understoodCount: "理解した",
    reviewCount: "復習する",
    remaining: "残り",
    dailyProgress: "今日の進み具合",
    vocabulary: "語彙",
    grammar: "文法",
    review: "復習",
    completeTitle: "文法学習完了",
    continuePath: "学習ルートへ戻る",
    restart: "もう一度",
    fallbackTitle: "この文法セッションが見つかりません",
    fallbackBody: "学習ルートに戻るか、N5基礎文法から始められます。",
    viLabel: "VI",
  },
  en: {
    back: "Back to path",
    todayItems: "patterns today",
    completed: "completed",
    minutes: "min",
    tapForDetail: "Tap to see example",
    structure: "Structure",
    example: "Example",
    note: "Note",
    understood: "Understood",
    notSure: "Needs review",
    sessionToday: "Today's session",
    understoodCount: "Understood",
    reviewCount: "Needs review",
    remaining: "Remaining",
    dailyProgress: "Today's progress",
    vocabulary: "Vocabulary",
    grammar: "Grammar",
    review: "Review",
    completeTitle: "Grammar session complete",
    continuePath: "Back to path",
    restart: "Restart session",
    fallbackTitle: "Grammar session not found",
    fallbackBody: "Go back to the learning path or start foundation grammar.",
    viLabel: "VI",
  },
} satisfies Record<Locale, Record<string, string>>

export function GrammarSessionClient({ sessionId, grammarItems }: GrammarSessionClientProps) {
  const router = useRouter()
  const { locale } = useI18n()
  const text = copy[locale] ?? copy.vi
  const { addActivity } = useActivityLog()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [results, setResults] = useState<Record<number, AnswerStatus>>({})
  const [isComplete, setIsComplete] = useState(false)
  const [loggedCompletion, setLoggedCompletion] = useState(false)

  const session = useMemo(
    () => resolveGrammarSession({ sessionId, items: grammarItems }),
    [grammarItems, sessionId]
  )
  const items = session.items
  const currentItem = items[currentIndex]
  const localized = currentItem
    ? localizeGrammarContent({
        pattern: currentItem.pattern,
        meaning: currentItem.meaning,
        structure: currentItem.structure,
        usageNote: currentItem.usageNote,
        locale,
      })
    : null
  const answeredCount = Object.keys(results).length
  const understoodCount = Object.values(results).filter((item) => item === "understood").length
  const reviewCount = Object.values(results).filter((item) => item === "review").length
  const remainingCount = Math.max(items.length - answeredCount, 0)
  const progress = items.length ? Math.round((answeredCount / items.length) * 100) : 0
  const isLastItem = currentIndex >= items.length - 1
  const sessionTitle = locale === "ja"
    ? session.id === "grammar-n5-foundation"
      ? "N5基礎文法"
      : `文法: ${currentItem?.pattern ?? "N5"}`
    : session.title

  useEffect(() => {
    if (!isComplete || loggedCompletion) return

    addActivity({
      type: "grammar_session",
      content: `${session.title}: ${understoodCount}/${items.length} mẫu đã hiểu`,
      topic: items[0]?.pattern ?? "Ngữ pháp N5",
      result: "completed",
      score: understoodCount,
      durationMinutes: session.estimatedMinutes,
    })
    setLoggedCompletion(true)
  }, [addActivity, isComplete, items.length, loggedCompletion, session, understoodCount])

  function resetCardState() {
    setIsFlipped(false)
  }

  function advanceAfterAnswer() {
    if (isLastItem) {
      setIsComplete(true)
      return
    }

    setCurrentIndex((current) => current + 1)
    resetCardState()
  }

  function handleUnderstood() {
    if (!currentItem) return
    setResults((current) => ({ ...current, [currentItem.id]: "understood" }))
    advanceAfterAnswer()
  }

  function handleNeedsReview() {
    if (!currentItem) return
    setResults((current) => ({ ...current, [currentItem.id]: "review" }))
    advanceAfterAnswer()
  }

  function restartSession() {
    setCurrentIndex(0)
    setResults({})
    setIsComplete(false)
    setLoggedCompletion(false)
    resetCardState()
  }

  if (!items.length || !currentItem || !localized) {
    return (
      <div className="-m-6 flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#fff8f1] p-6">
        <Card className="max-w-xl border-[#dfb6aa] bg-[#fffdf8]">
          <CardContent className="space-y-4 p-8 text-center">
            <h1 className="text-2xl font-bold text-[#2a211f]">{text.fallbackTitle}</h1>
            <p className="text-[#6f5952]">{text.fallbackBody}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild className="rounded-full bg-[#702f2a] text-white hover:bg-[#5d2723]">
                <Link href="/learning-path">{text.back}</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full border-[#dfb6aa] bg-white/70">
                <Link href="/grammar/session/grammar-n5-foundation">N5</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isComplete) {
    return (
      <div className="-m-6 min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_8%_12%,rgba(243,200,189,0.55),transparent_28%),linear-gradient(135deg,#fff8f1_0%,#fffdf8_50%,#f7d9d2_100%)] p-6">
        <div className="mx-auto max-w-5xl space-y-6">
          <Card className="border-[#dfb6aa] bg-[#fffdf8]/95 shadow-sm">
            <CardContent className="space-y-6 p-8">
              <div className="text-center">
                <Badge className="mb-3 rounded-full bg-[#dcebd9] text-[#315d41]">{progress}%</Badge>
                <h1 className="text-3xl font-bold text-[#2a211f]">{text.completeTitle}</h1>
                <p className="mt-2 text-[#6f5952]">{sessionTitle}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-[#edf6ea] p-4 text-center text-[#315d41]">
                  <p className="text-sm">{text.understoodCount}</p>
                  <p className="text-3xl font-bold">{understoodCount}</p>
                </div>
                <div className="rounded-2xl bg-[#fff2e5] p-4 text-center text-[#8a4b1d]">
                  <p className="text-sm">{text.reviewCount}</p>
                  <p className="text-3xl font-bold">{reviewCount}</p>
                </div>
              </div>

              <div className="grid gap-2">
                {items.map((item) => {
                  const status = results[item.id]
                  return (
                    <div key={item.id} className="flex items-center justify-between rounded-2xl border border-[#ead0c6] bg-white/70 px-4 py-3">
                      <div>
                        <p className="font-semibold text-[#2a211f]">{item.pattern}</p>
                        <p className="text-sm text-[#6f5952]">{item.meaning}</p>
                      </div>
                      {status === "understood" ? (
                        <CheckCircle2 className="h-5 w-5 text-[#315d41]" />
                      ) : status === "review" ? (
                        <XCircle className="h-5 w-5 text-[#9f4b32]" />
                      ) : null}
                    </div>
                  )
                })}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button className="rounded-full bg-[#702f2a] px-6 text-white hover:bg-[#5d2723]" onClick={() => router.push("/learning-path")}>
                  {text.continuePath}
                </Button>
                <Button variant="ghost" className="rounded-full px-6" onClick={restartSession}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {text.restart}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="-m-6 min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_8%_12%,rgba(243,200,189,0.55),transparent_28%),linear-gradient(135deg,#fff8f1_0%,#fffdf8_50%,#f7d9d2_100%)] p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="rounded-3xl border border-[#dfb6aa] bg-[#fffdf8]/90 p-4 shadow-sm">
          <Link href="/learning-path" className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-[#702f2a]">
            <ArrowLeft className="h-4 w-4" />
            {text.back}
          </Link>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#2a211f]">{sessionTitle}</h1>
              <div className="mt-2 flex flex-wrap gap-2 text-sm text-[#6f5952]">
                <span>{items.length} {text.todayItems}</span>
                <span>{answeredCount}/{items.length} {text.completed}</span>
                <span>~{session.estimatedMinutes} {text.minutes}</span>
              </div>
            </div>
            <div className="w-full lg:w-[360px]">
              <div className="mb-1 flex justify-between text-xs text-[#6f5952]">
                <span>{progress}%</span>
                <span>{remainingCount} {text.remaining}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <main className="flex min-h-[560px] flex-col items-center justify-center rounded-3xl border border-[#dfb6aa] bg-[#fffdf8]/80 p-4 shadow-sm">
            <button
              type="button"
              className="group h-[420px] w-full max-w-2xl [perspective:1200px]"
              onClick={() => setIsFlipped((current) => !current)}
              aria-label={text.tapForDetail}
            >
              <div
                className={cn(
                  "relative h-full w-full rounded-[2rem] transition-transform duration-500 [transform-style:preserve-3d]",
                  isFlipped && "[transform:rotateY(180deg)]"
                )}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[2rem] border border-[#dfb6aa] bg-[#fff8f1] p-8 text-center shadow-[0_18px_45px_rgba(112,47,42,0.12)] [backface-visibility:hidden]">
                  <p className="text-5xl font-bold tracking-tight text-[#702f2a]">{currentItem.pattern}</p>
                  <p className="mt-5 text-2xl font-semibold text-[#2a211f]">{localized.meaning}</p>
                  {locale === "ja" && localized.secondary.length > 0 && (
                    <p className="mt-2 text-sm text-[#8f4742]">{localized.secondary[0]}</p>
                  )}
                  <p className="mt-10 text-sm font-medium text-[#8f4742]">{text.tapForDetail}</p>
                </div>

                <div className="absolute inset-0 flex flex-col justify-center rounded-[2rem] border border-[#dfb6aa] bg-[#fff8f1] p-8 shadow-[0_18px_45px_rgba(112,47,42,0.12)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <p className="text-center text-4xl font-bold tracking-tight text-[#702f2a]">{currentItem.pattern}</p>
                  <div className="my-5 h-px w-full bg-[#dfb6aa]" />
                  <div className="space-y-5">
                    <section>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8f4742]">{text.structure}</p>
                      <p className="mt-2 rounded-2xl bg-white/70 p-3 font-mono text-sm text-[#2a211f]">{localized.structure}</p>
                    </section>
                    <section>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8f4742]">{text.example}</p>
                      <p className="mt-2 font-semibold text-[#2a211f]">{currentItem.example.japanese}</p>
                      <p className="mt-1 text-[#6f5952]">
                        {locale === "ja" ? `${text.viLabel}: ${currentItem.example.vietnamese}` : currentItem.example.vietnamese}
                      </p>
                    </section>
                    {localized.usageNote && (
                      <section>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8f4742]">{text.note}</p>
                        <p className="mt-2 text-sm leading-6 text-[#6f5952]">
                          {locale === "ja" ? `${text.viLabel}: ${localized.usageNote}` : localized.usageNote}
                        </p>
                      </section>
                    )}
                  </div>
                </div>
              </div>
            </button>

            <div className="mt-5 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
              <Button variant="outline" className="rounded-full border-[#dfb6aa] bg-white/70 text-[#8f4742]" onClick={handleNeedsReview}>
                <XCircle className="mr-2 h-4 w-4" />
                {text.notSure}
              </Button>
              <Button className="rounded-full bg-[#315d41] text-white hover:bg-[#254a33]" onClick={handleUnderstood}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {text.understood}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </main>

          <aside className="space-y-4">
            <Card className="border-[#dfb6aa] bg-[#fffdf8]/90 shadow-sm">
              <CardContent className="space-y-4 p-5">
                <h2 className="font-semibold text-[#2a211f]">{text.sessionToday}</h2>
                {[
                  { label: text.todayItems, value: items.length },
                  { label: text.understoodCount, value: understoodCount },
                  { label: text.reviewCount, value: reviewCount },
                  { label: text.remaining, value: remainingCount },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3 text-sm">
                    <span className="text-[#6f5952]">{item.label}</span>
                    <strong className="text-[#2a211f]">{item.value}</strong>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-[#dfb6aa] bg-[#fffdf8]/90 shadow-sm">
              <CardContent className="space-y-4 p-5">
                <h2 className="font-semibold text-[#2a211f]">{text.dailyProgress}</h2>
                {[
                  { label: text.vocabulary, done: false },
                  { label: text.grammar, done: answeredCount === items.length },
                  { label: text.review, done: reviewCount > 0 },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-3 text-sm">
                    {item.done ? (
                      <CheckCircle2 className="h-5 w-5 text-[#315d41]" />
                    ) : (
                      <span className="h-5 w-5 rounded border border-[#dfb6aa]" />
                    )}
                    <span className="text-[#2a211f]">{item.label}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  )
}
