"use client"

import Image from "next/image"
import { useMemo, useState } from "react"
import { VocabularyCard } from "@/components/app/vocabulary-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Search,
  BookOpen,
  CheckCircle2,
  RefreshCw,
  PlayCircle,
  RotateCcw,
  XCircle,
  ArrowRight,
  Volume2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useStudyProgress } from "@/hooks/use-study-progress"
import { useActivityLog } from "@/hooks/use-activity-log"
import { localizeVocabularyMeaning } from "@/lib/localized-study-content"
import { useI18n } from "@/lib/i18n"
import { getVocabularyExample } from "@/lib/vocabulary-examples"
import type { VocabularyItem } from "@/lib/data/nihongo-study"

type StudyMode = "all" | "new" | "review"

const ALL_TOPIC = "Tất cả"

const paperCardStyle = {
  backgroundColor: "transparent",
  backgroundImage: "url('/assets/paper-card-bg-clean.png')",
  backgroundRepeat: "no-repeat",
  backgroundSize: "100% 100%",
  backgroundPosition: "center",
} as const

type VocabularyPageClientProps = {
  initialItems: VocabularyItem[]
  initialTopics: string[]
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

export function VocabularyPageClient({ initialItems, initialTopics }: VocabularyPageClientProps) {
  const [selectedTopic, setSelectedTopic] = useState(ALL_TOPIC)
  const [searchQuery, setSearchQuery] = useState("")
  const [studyMode, setStudyMode] = useState<StudyMode>("all")
  const [isFlashcardOpen, setIsFlashcardOpen] = useState(false)
  const [flashcardIndex, setFlashcardIndex] = useState(0)
  const [isAnswerShown, setIsAnswerShown] = useState(false)
  const { locale } = useI18n()
  const {
    learnedVocabularySet,
    reviewVocabularySet,
    stats,
    markVocabularyLearned,
    addVocabularyToReview,
  } = useStudyProgress()
  const { addActivity } = useActivityLog()

  const topicCounts = useMemo(() => {
    const counts = new Map<string, number>()

    for (const item of initialItems) {
      counts.set(item.topic, (counts.get(item.topic) ?? 0) + 1)
    }

    return counts
  }, [initialItems])

  const filteredVocabulary = useMemo(() => {
    return initialItems.filter((vocab) => {
      const matchesTopic = selectedTopic === ALL_TOPIC || vocab.topic === selectedTopic
      const matchesMode =
        studyMode === "all" ||
        (studyMode === "new" && !learnedVocabularySet.has(vocab.id) && !reviewVocabularySet.has(vocab.id)) ||
        (studyMode === "review" && reviewVocabularySet.has(vocab.id))
      const normalizedSearch = searchQuery.toLowerCase()
      const matchesSearch =
        vocab.japanese.includes(searchQuery) ||
        vocab.hiragana.includes(searchQuery) ||
        vocab.romaji.toLowerCase().includes(normalizedSearch) ||
        vocab.vietnamese.toLowerCase().includes(normalizedSearch)

      return matchesTopic && matchesMode && matchesSearch
    })
  }, [initialItems, learnedVocabularySet, reviewVocabularySet, searchQuery, selectedTopic, studyMode])

  const totalVocabulary = initialItems.length
  const progressValue = totalVocabulary > 0 ? Math.round((stats.learnedVocabulary / totalVocabulary) * 100) : 0
  const flashcardItems = filteredVocabulary.length > 0 ? filteredVocabulary : initialItems
  const currentFlashcard = flashcardItems[flashcardIndex % flashcardItems.length]
  const currentExample = currentFlashcard ? getVocabularyExample(currentFlashcard) : null
  const localizedMeaning = currentFlashcard
    ? localizeVocabularyMeaning({
        japanese: currentFlashcard.japanese,
        hiragana: currentFlashcard.hiragana,
        romaji: currentFlashcard.romaji,
        meaning: currentFlashcard.vietnamese,
        locale,
      })
    : null

  function openFlashcards(mode: StudyMode) {
    setStudyMode(mode)
    setSelectedTopic(ALL_TOPIC)
    setSearchQuery("")
    setFlashcardIndex(0)
    setIsAnswerShown(false)
    setIsFlashcardOpen(true)
  }

  function goNextFlashcard() {
    setFlashcardIndex((current) => (current + 1) % Math.max(flashcardItems.length, 1))
    setIsAnswerShown(false)
  }

  function markCurrentLearned() {
    if (!currentFlashcard) return

    markVocabularyLearned(currentFlashcard.id)
    addActivity({
      type: "vocabulary",
      content: `Học từ vựng: ${currentFlashcard.japanese} - ${currentFlashcard.vietnamese}`,
      topic: currentFlashcard.topic,
      result: "Đã học",
      durationMinutes: 4,
    })
    goNextFlashcard()
  }

  function reviewCurrentLater() {
    if (!currentFlashcard) return

    addVocabularyToReview(currentFlashcard.id)
    addActivity({
      type: "review",
      content: `Cần ôn lại: ${currentFlashcard.japanese} - ${currentFlashcard.vietnamese}`,
      topic: currentFlashcard.topic,
      result: "Cần ôn",
      durationMinutes: 1,
    })
    goNextFlashcard()
  }

  return (
    <div className="-m-6 min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_8%_12%,rgba(243,200,189,0.55),transparent_28%),linear-gradient(135deg,#fff8f1_0%,#fffdf8_50%,#f7d9d2_100%)] p-6">
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-xl bg-[#fff8f1]/85 px-6 py-5">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px] md:items-center">
            <div className="relative max-w-2xl">
              <Badge variant="outline" className="mb-3 border-[#d89a92] bg-[#f3c8bd]/45 text-[#8f4742]">
                Từ vựng N5
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight text-[#2a211f]">Kho từ học và ôn tập</h1>
              <p className="mt-2 text-base leading-7 text-[#4f403b]">
                Học bằng flashcard, nghe phát âm, lật nghĩa và đưa từ khó vào danh sách ôn tập.
              </p>
            </div>
            <div className="hidden h-40 items-center justify-center md:flex">
              <Image
                src="/assets/vocab-card-clean.png"
                alt=""
                width={260}
                height={220}
                aria-hidden="true"
                className="h-40 w-48 object-contain drop-shadow-[0_10px_18px_rgba(143,71,66,0.18)]"
              />
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-4">
          <div className="space-y-6 lg:col-span-3">
            <div className="flex flex-col gap-4 rounded-xl border border-[#dfb6aa] bg-[#fffdf8]/85 p-3 shadow-sm sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm từ vựng..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="border-[#dfb6aa] bg-white/70 pl-10"
                />
              </div>
              <div className="grid grid-cols-3 rounded-full border border-[#dfb6aa] bg-[#f9ece6]/80 p-1 sm:w-[360px]">
                {[
                  { value: "all", label: "Tất cả" },
                  { value: "new", label: "Từ mới" },
                  { value: "review", label: "Cần ôn" },
                ].map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={studyMode === option.value ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "h-8 rounded-full",
                      studyMode === option.value && "bg-[#702f2a] text-white hover:bg-[#5d2723]"
                    )}
                    onClick={() => setStudyMode(option.value as StudyMode)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 rounded-xl border border-[#dfb6aa] bg-[#fffdf8]/85 p-2 shadow-sm">
              {initialTopics.map((topic) => (
                <Button
                  key={topic}
                  variant={selectedTopic === topic ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTopic(topic)}
                  className={cn(
                    "rounded-full",
                    selectedTopic === topic && "bg-[#702f2a] text-white hover:bg-[#5d2723]"
                  )}
                >
                  <span>{topic}</span>
                  <Badge
                    variant={selectedTopic === topic ? "secondary" : "outline"}
                    className="ml-2 h-5 rounded-full px-1.5 text-[11px]"
                  >
                    {topic === ALL_TOPIC ? totalVocabulary : topicCounts.get(topic) ?? 0}
                  </Badge>
                </Button>
              ))}
            </div>

            {isFlashcardOpen && currentFlashcard && localizedMeaning && (
              <Card className="border-[#dfb6aa] bg-[#fffdf8]/95 shadow-sm">
                <CardContent className="space-y-5 p-6">
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant="outline" className="border-[#d89a92] text-[#8f4742]">
                      {flashcardIndex + 1} / {flashcardItems.length}
                    </Badge>
                    <Button variant="ghost" size="sm" className="rounded-full" onClick={() => setIsFlashcardOpen(false)}>
                      Đóng flashcard
                    </Button>
                  </div>

                  <button
                    type="button"
                    className="w-full rounded-xl border border-[#ead0c6] bg-[#fff8f1] p-8 text-center transition hover:bg-white"
                    onClick={() => setIsAnswerShown((current) => !current)}
                  >
                    <p className="text-5xl font-bold tracking-tight text-[#2a211f]">{currentFlashcard.japanese}</p>
                    <p className="mt-3 text-xl text-[#8f4742]">{currentFlashcard.hiragana}</p>
                    <p className="mt-1 text-sm font-medium text-[#6f5952]">{currentFlashcard.romaji}</p>

                    {isAnswerShown ? (
                      <div className="mt-6 space-y-3 border-t border-[#ead0c6] pt-5">
                        <p className="text-2xl font-semibold text-[#2a211f]">{localizedMeaning.primary}</p>
                        {currentExample && (
                          <div className="text-sm text-[#6f5952]">
                            <p className="font-semibold text-[#2a211f]">{currentExample.japanese}</p>
                            <p>{currentExample.vietnamese}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="mt-6 text-sm font-medium text-[#6f5952]">Bấm vào thẻ để lật nghĩa</p>
                    )}
                  </button>

                  <div className="grid gap-2 sm:grid-cols-4">
                    <Button variant="outline" className="rounded-full border-[#dfb6aa] bg-white/60" onClick={() => speakJapanese(currentFlashcard.japanese)}>
                      <Volume2 className="mr-2 h-4 w-4" />
                      Nghe
                    </Button>
                    <Button variant="outline" className="rounded-full border-[#dfb6aa] bg-white/60" onClick={reviewCurrentLater}>
                      <XCircle className="mr-2 h-4 w-4" />
                      Chưa nhớ
                    </Button>
                    <Button className="rounded-full bg-[#315d41] text-white hover:bg-[#254a33]" onClick={markCurrentLearned}>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Đã nhớ
                    </Button>
                    <Button variant="outline" className="rounded-full border-[#dfb6aa] bg-white/60" onClick={goNextFlashcard}>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Tiếp
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {filteredVocabulary.map((vocab) => (
                <VocabularyCard
                  key={vocab.id}
                  japanese={vocab.japanese}
                  hiragana={vocab.hiragana}
                  romaji={vocab.romaji}
                  vietnamese={vocab.vietnamese}
                  type={vocab.type}
                  imageUrl={vocab.imageUrl}
                  example={getVocabularyExample(vocab)}
                  isLearned={learnedVocabularySet.has(vocab.id)}
                  onMarkLearned={() => {
                    markVocabularyLearned(vocab.id)
                    addActivity({
                      type: "vocabulary",
                      content: `Học từ vựng: ${vocab.japanese} - ${vocab.vietnamese}`,
                      topic: vocab.topic,
                      result: "Đã học",
                      durationMinutes: 5,
                    })
                  }}
                  onAddToReview={() => {
                    addVocabularyToReview(vocab.id)
                    addActivity({
                      type: "review",
                      content: `Thêm vào ôn tập: ${vocab.japanese} - ${vocab.vietnamese}`,
                      topic: vocab.topic,
                      result: "Cần ôn",
                      durationMinutes: 1,
                    })
                  }}
                />
              ))}
            </div>

            {filteredVocabulary.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="font-medium">Không tìm thấy từ vựng</h3>
                <p className="text-sm text-muted-foreground">Thử tìm kiếm với từ khóa khác</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Card className="border-none bg-transparent shadow-none" style={paperCardStyle}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Thống kê từ vựng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span className="text-sm">Tổng số từ</span>
                  </div>
                  <Badge variant="secondary">{totalVocabulary}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span className="text-sm">Đã học</span>
                  </div>
                  <Badge className="bg-success/10 text-success">{stats.learnedVocabulary}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-accent" />
                    <span className="text-sm">Cần ôn tập</span>
                  </div>
                  <Badge className="bg-accent/10 text-accent">{stats.reviewVocabulary}</Badge>
                </div>
                <div className="pt-2">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span>Tiến độ</span>
                    <span className="text-muted-foreground">{progressValue}%</span>
                  </div>
                  <Progress value={progressValue} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none bg-transparent shadow-none" style={paperCardStyle}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Luyện tập nhanh</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full rounded-full bg-[#702f2a] text-white hover:bg-[#5d2723]"
                  onClick={() => openFlashcards("new")}
                >
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Học từ mới
                </Button>
                <Button
                  variant="outline"
                  className="w-full rounded-full border-[#dfb6aa] bg-white/60 text-[#702f2a]"
                  onClick={() => openFlashcards("review")}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Ôn tập ({stats.reviewVocabulary} từ)
                </Button>
                <Button
                  variant="outline"
                  className="w-full rounded-full border-[#dfb6aa] bg-white/60 text-[#702f2a]"
                  onClick={() => openFlashcards("all")}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Flashcard tất cả
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
