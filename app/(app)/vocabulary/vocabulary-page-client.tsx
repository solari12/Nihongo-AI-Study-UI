"use client"

import Image from "next/image"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  BookOpen,
  CheckCircle2,
  Clock3,
  Filter,
  PlayCircle,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react"

import { VocabularyCard } from "@/components/app/vocabulary-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { readJsonResponse } from "@/lib/http"
import { cn } from "@/lib/utils"
import type { VocabularyItem } from "@/lib/data/nihongo-study"
import type {
  VocabularyLearningStage,
  VocabularySessionDto,
  VocabularySessionKind,
} from "@/lib/vocabulary/types"

type LibraryFilter = "all" | "unseen" | "learning" | "mastered" | "due"

type VocabularyPageClientProps = {
  initialItems: VocabularyItem[]
  initialTopics: string[]
  initialProgress: Array<{
    vocabularyId: number
    stage: VocabularyLearningStage
    dueAt: string
  }>
  activeSession: {
    id: string
    kind: VocabularySessionKind
    currentPosition: number
    totalItems: number
  } | null
}

const ALL_TOPIC = "Tất cả"

const paperCardStyle = {
  backgroundColor: "transparent",
  backgroundImage: "url('/assets/paper-card-bg-clean.png')",
  backgroundRepeat: "no-repeat",
  backgroundSize: "100% 100%",
  backgroundPosition: "center",
} as const

const statusLabels: Record<VocabularyLearningStage, string> = {
  learning: "Đang học",
  review: "Đang ôn",
  mastered: "Đã vững",
}

async function createVocabularySession(input: {
  kind: VocabularySessionKind
  topicKey?: string
  seedVocabularyId?: number
}) {
  const response = await fetch("/api/vocabulary/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, limit: 10 }),
  })
  return readJsonResponse<{
    session: VocabularySessionDto | null
    resumed: boolean
    empty: boolean
  }>(response)
}

export function VocabularyPageClient({
  initialItems,
  initialTopics,
  initialProgress,
  activeSession,
}: VocabularyPageClientProps) {
  const router = useRouter()
  const [selectedTopic, setSelectedTopic] = useState(ALL_TOPIC)
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState<LibraryFilter>("all")
  const [startingKey, setStartingKey] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const progressById = useMemo(
    () => new Map(initialProgress.map((item) => [item.vocabularyId, item])),
    [initialProgress]
  )
  const dueIds = useMemo(() => {
    const now = Date.now()
    return new Set(
      initialProgress
        .filter((item) => new Date(item.dueAt).getTime() <= now)
        .map((item) => item.vocabularyId)
    )
  }, [initialProgress])

  const topicCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of initialItems) counts.set(item.topic, (counts.get(item.topic) ?? 0) + 1)
    return counts
  }, [initialItems])

  const filteredVocabulary = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase()
    return initialItems.filter((item) => {
      const progress = progressById.get(item.id)
      const matchesTopic = selectedTopic === ALL_TOPIC || item.topic === selectedTopic
      const matchesFilter =
        filter === "all" ||
        (filter === "unseen" && !progress) ||
        (filter === "learning" && progress?.stage !== "mastered") ||
        (filter === "mastered" && progress?.stage === "mastered") ||
        (filter === "due" && dueIds.has(item.id))
      const matchesSearch =
        !normalizedSearch ||
        item.japanese.includes(searchQuery) ||
        item.hiragana.includes(searchQuery) ||
        item.romaji.toLowerCase().includes(normalizedSearch) ||
        item.vietnamese.toLowerCase().includes(normalizedSearch)
      return matchesTopic && matchesFilter && matchesSearch
    })
  }, [dueIds, filter, initialItems, progressById, searchQuery, selectedTopic])

  const studied = initialProgress.length
  const mastered = initialProgress.filter((item) => item.stage === "mastered").length
  const dueReview = dueIds.size
  const progressValue = initialItems.length
    ? Math.round((studied / initialItems.length) * 100)
    : 0

  async function startSession(
    key: string,
    input: { kind: VocabularySessionKind; topicKey?: string; seedVocabularyId?: number }
  ) {
    if (startingKey) return
    setStartingKey(key)
    setMessage(null)
    try {
      const result = await createVocabularySession(input)
      if (!result.session || result.empty) {
        setMessage(
          input.kind === "review"
            ? "Hiện chưa có từ nào đến hạn ôn."
            : "Không còn từ phù hợp để tạo phiên học này."
        )
        return
      }
      router.push(`/vocabulary/session/${result.session.id}`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể tạo phiên học.")
    } finally {
      setStartingKey(null)
    }
  }

  return (
    <div className="-m-6 min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_8%_12%,rgba(243,200,189,0.55),transparent_28%),linear-gradient(135deg,#fff8f1_0%,#fffdf8_50%,#f7d9d2_100%)] p-6">
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-xl bg-[#fff8f1]/85 px-6 py-5">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px] md:items-center">
            <div className="relative max-w-2xl">
              <Badge variant="outline" className="mb-3 border-[#d89a92] bg-[#f3c8bd]/45 text-[#8f4742]">
                Kho từ vựng N5
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight text-[#2a211f]">Tra cứu và bắt đầu phiên học</h1>
              <p className="mt-2 text-base leading-7 text-[#4f403b]">
                Mỗi phiên gồm tối đa 10 từ. Lịch ôn được tự động điều chỉnh theo mức Quên, Khó và Nhớ.
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

        {activeSession && (
          <Card className="border-[#b9d7bd] bg-[#edf6ea] shadow-sm">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-[#315d41]">Bạn có một phiên học đang dang dở</p>
                <p className="mt-1 text-sm text-[#496c55]">
                  Đã hoàn thành {activeSession.currentPosition}/{activeSession.totalItems} từ.
                </p>
              </div>
              <Button
                className="rounded-full bg-[#315d41] text-white hover:bg-[#254a33]"
                onClick={() => router.push(`/vocabulary/session/${activeSession.id}`)}
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                Tiếp tục phiên học
              </Button>
            </CardContent>
          </Card>
        )}

        {message && (
          <div className="rounded-xl border border-[#dfb6aa] bg-[#fffdf8] px-4 py-3 text-sm text-[#8f4742]">
            {message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-4">
          <div className="space-y-5 lg:col-span-3">
            <div className="space-y-3 rounded-xl border border-[#dfb6aa] bg-[#fffdf8]/85 p-3 shadow-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo kanji, kana, romaji hoặc nghĩa..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="border-[#dfb6aa] bg-white/70 pl-10"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "all", label: "Tất cả" },
                  { value: "unseen", label: "Chưa học" },
                  { value: "learning", label: "Đang học" },
                  { value: "mastered", label: "Đã vững" },
                  { value: "due", label: `Đến hạn ôn (${dueReview})` },
                ].map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={filter === option.value ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "rounded-full border-[#dfb6aa]",
                      filter === option.value && "bg-[#702f2a] text-white hover:bg-[#5d2723]"
                    )}
                    onClick={() => setFilter(option.value as LibraryFilter)}
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
                    "rounded-full border-[#dfb6aa]",
                    selectedTopic === topic && "bg-[#702f2a] text-white hover:bg-[#5d2723]"
                  )}
                >
                  {topic}
                  <Badge variant="secondary" className="ml-2 h-5 rounded-full px-1.5 text-[11px]">
                    {topic === ALL_TOPIC ? initialItems.length : topicCounts.get(topic) ?? 0}
                  </Badge>
                </Button>
              ))}
            </div>

            {selectedTopic !== ALL_TOPIC && (
              <Button
                className="rounded-full bg-[#702f2a] text-white hover:bg-[#5d2723]"
                disabled={Boolean(startingKey)}
                onClick={() => {
                  const first = initialItems.find((item) => item.topic === selectedTopic)
                  void startSession(`topic-${selectedTopic}`, {
                    kind: "topic",
                    topicKey: first?.topicKey ?? selectedTopic,
                  })
                }}
              >
                <Filter className="mr-2 h-4 w-4" />
                Học 10 từ chủ đề {selectedTopic}
              </Button>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {filteredVocabulary.map((item) => (
                <VocabularyCard
                  key={item.id}
                  japanese={item.japanese}
                  hiragana={item.hiragana}
                  romaji={item.romaji}
                  vietnamese={item.vietnamese}
                  type={item.type}
                  imageUrl={item.imageUrl}
                  example={item.example}
                  statusLabel={
                    dueIds.has(item.id)
                      ? "Đến hạn ôn"
                      : progressById.get(item.id)
                        ? statusLabels[progressById.get(item.id)!.stage]
                        : undefined
                  }
                  isStarting={startingKey === `seed-${item.id}`}
                  onStudy={() =>
                    void startSession(`seed-${item.id}`, {
                      kind: "seeded",
                      seedVocabularyId: item.id,
                    })
                  }
                />
              ))}
            </div>

            {!filteredVocabulary.length && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="font-medium">Không tìm thấy từ phù hợp</h3>
                <p className="text-sm text-muted-foreground">Thử đổi từ khóa hoặc bộ lọc.</p>
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <Card className="border-none bg-transparent shadow-none" style={paperCardStyle}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Tiến độ từ vựng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Tổng số từ", value: initialItems.length, icon: BookOpen },
                  { label: "Đã học", value: studied, icon: CheckCircle2 },
                  { label: "Đã vững", value: mastered, icon: Sparkles },
                  { label: "Đến hạn ôn", value: dueReview, icon: Clock3 },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <item.icon className="h-4 w-4 text-[#702f2a]" />
                      {item.label}
                    </div>
                    <Badge variant="secondary">{item.value}</Badge>
                  </div>
                ))}
                <div className="pt-2">
                  <div className="mb-2 flex justify-between text-sm">
                    <span>Độ phủ</span>
                    <span>{progressValue}%</span>
                  </div>
                  <Progress value={progressValue} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none bg-transparent shadow-none" style={paperCardStyle}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Bắt đầu học</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full rounded-full bg-[#702f2a] text-white hover:bg-[#5d2723]"
                  disabled={Boolean(startingKey)}
                  onClick={() => void startSession("new", { kind: "new" })}
                >
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Học 10 từ mới
                </Button>
                <Button
                  variant="outline"
                  className="w-full rounded-full border-[#dfb6aa] bg-white/60 text-[#702f2a]"
                  disabled={Boolean(startingKey) || dueReview === 0}
                  onClick={() => void startSession("review", { kind: "review" })}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Ôn tập ({dueReview} từ đến hạn)
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  )
}
