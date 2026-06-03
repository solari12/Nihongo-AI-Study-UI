"use client"

import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { useMemo, useState, useEffect } from "react"
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileQuestion,
  Languages,
  ListChecks,
  MessageSquare,
  Plus,
  Search,
  Trash2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/use-auth"
import { CHAT_ACTIVE_SOURCE_STORAGE_KEY, type ActiveChatSource } from "@/lib/chat/active-source"
import { cn } from "@/lib/utils"

type ReadingArticle = {
  id: string
  sourceUrl: string
  provider: string
  title: string
  level: string
  category: string | null
  articleText: string
  articleBlocks?: ArticleBlock[]
  imageUrl: string | null
  audioUrl: string | null
  publishedAt: string | null
  questions: unknown
  highlights?: HighlightTerm[]
  levelStats?: LevelStat[]
  vocabulary: unknown
  grammar: unknown
  createdAt: string
}

type LevelStat = {
  level: string
  percentage: number
}

type QuestionItem = {
  question?: string
  options?: Array<{ key?: string; text?: string }>
  correctAnswer?: string
  rawText?: string
}

type StudyItem = {
  text?: string
  level?: string | null
}

type VocabularyDisplayItem = {
  word: string
  reading: string
  level: string | null
  meaning: string
  partOfSpeech: string
}

type GrammarDisplayItem = {
  pattern: string
  level: string | null
  description: string
  example: string
}

type HighlightTerm = {
  text: string
  level: string | null
  type: string | null
}

type ArticleToken = {
  text: string
  reading: string | null
}

type ArticleBlock = {
  text: string
  tokens: ArticleToken[]
}

type SavedStudyApiItem = {
  itemKey: string
}

// Cấu trúc State mới: Quản lý trạng thái độc lập cho từng bài đọc
type QuizState = {
  answers: Record<string, string>
  submitted: Record<string, boolean>
  currentIndex: Record<string, number>
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function formatDate(value: string | null) {
  if (!value) return "Chưa rõ ngày"
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value))
}

function splitJapaneseSentences(text: string) {
  return text
    .split(/(?<=\u3002)/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
}

function compactText(value: unknown) {
  if (typeof value === "string") return value
  if (value && typeof value === "object" && "text" in value) {
    return String((value as { text?: unknown }).text ?? "")
  }
  return JSON.stringify(value)
}

function articlePreview(article: ReadingArticle) {
  const firstSentence = splitJapaneseSentences(article.articleText)[0]
  return firstSentence ?? article.articleText.slice(0, 120)
}

function parseVocabularyItem(item: StudyItem): VocabularyDisplayItem {
  const text = compactText(item)
  const partOfSpeechMatch = text.match(/(danh từ|động từ|tính từ|trạng từ|liên từ|thán từ|trợ từ)$/i)
  const partOfSpeech = partOfSpeechMatch?.[0] ?? ""
  const withoutPartOfSpeech = partOfSpeech ? text.slice(0, -partOfSpeech.length) : text
  const levelMatch = withoutPartOfSpeech.match(/N[1-5]/)
  const level = item.level ?? levelMatch?.[0] ?? null

  if (!levelMatch) {
    return {
      word: text,
      reading: "",
      level,
      meaning: "",
      partOfSpeech,
    }
  }

  const japaneseText = withoutPartOfSpeech.slice(0, levelMatch.index).trim()
  const meaning = withoutPartOfSpeech.slice((levelMatch.index ?? 0) + levelMatch[0].length).trim()
  const readingMatch = japaneseText.match(/[ぁ-んァ-ンー]+$/)
  const reading = readingMatch?.[0] ?? ""
  const word = reading ? japaneseText.slice(0, -reading.length).trim() : japaneseText

  return {
    word: word || japaneseText,
    reading,
    level,
    meaning,
    partOfSpeech,
  }
}

function parseGrammarItem(item: StudyItem): GrammarDisplayItem {
  const text = compactText(item)
  const levelMatch = text.match(/N[1-5]/)
  const level = item.level ?? levelMatch?.[0] ?? null

  if (!levelMatch) {
    return {
      pattern: text,
      level,
      description: "",
      example: "",
    }
  }

  const pattern = text.slice(0, levelMatch.index).trim()
  const rest = text.slice((levelMatch.index ?? 0) + levelMatch[0].length).trim()
  const exampleMatch = rest.match(/[一-龯ぁ-んァ-ンー々「」（）・、。0-9A-Za-z\s:&]+。$/)
  const example = exampleMatch?.[0].trim() ?? ""
  const description = example ? rest.slice(0, -example.length).trim() : rest

  return {
    pattern,
    level,
    description,
    example,
  }
}

const levelStyles: Record<string, { badge: string; chipActive: string; highlight: string }> = {
  N1: {
    badge: "bg-[#ef4444] text-white hover:bg-[#dc2626]",
    chipActive: "bg-[#ef4444] text-white hover:bg-[#dc2626]",
    highlight: "border-[#ef4444] bg-[#fee2e2] text-[#7f1d1d]",
  },
  N2: {
    badge: "bg-[#f97316] text-white hover:bg-[#ea580c]",
    chipActive: "bg-[#f97316] text-white hover:bg-[#ea580c]",
    highlight: "border-[#f97316] bg-[#ffedd5] text-[#7c2d12]",
  },
  N3: {
    badge: "bg-[#22c55e] text-white hover:bg-[#16a34a]",
    chipActive: "bg-[#22c55e] text-white hover:bg-[#16a34a]",
    highlight: "border-[#22c55e] bg-[#dcfce7] text-[#14532d]",
  },
  N4: {
    badge: "bg-[#38bdf8] text-white hover:bg-[#0ea5e9]",
    chipActive: "bg-[#38bdf8] text-white hover:bg-[#0ea5e9]",
    highlight: "border-[#38bdf8] bg-[#e0f2fe] text-[#075985]",
  },
  N5: {
    badge: "bg-[#7e57c2] text-white hover:bg-[#6f43bd]",
    chipActive: "bg-[#7e57c2] text-white hover:bg-[#6f43bd]",
    highlight: "border-[#7e57c2] bg-[#ede7f6] text-[#4a2b87]",
  },
}

function levelBadgeClass(level: string | null | undefined) {
  return level ? levelStyles[level]?.badge ?? "bg-[#24b26b] text-white hover:bg-[#1d9659]" : "bg-[#24b26b] text-white hover:bg-[#1d9659]"
}

function levelChipActiveClass(level: string) {
  return levelStyles[level]?.chipActive ?? "bg-[#24b26b] text-white hover:bg-[#1d9659]"
}

function levelHighlightClass(level: string | null | undefined) {
  return level ? levelStyles[level]?.highlight ?? "border-[#24b26b] bg-[#ecf9f1] text-[#17683e]" : "border-[#24b26b] bg-[#ecf9f1] text-[#17683e]"
}

function uniqueHighlightTerms(terms: HighlightTerm[]) {
  const byText = new Map<string, HighlightTerm>()

  for (const term of terms) {
    const text = term.text.trim()
    if (!text || text.length < 2) continue

    const current = byText.get(text)
    if (!current || current.type === "vocabulary") {
      byText.set(text, { ...term, text })
    }
  }

  return Array.from(byText.values()).sort((a, b) => b.text.length - a.text.length)
}

function renderHighlightedSentence(sentence: string, terms: HighlightTerm[]) {
  const nodes: React.ReactNode[] = []
  let index = 0

  while (index < sentence.length) {
    const term = terms.find((item) => sentence.startsWith(item.text, index))

    if (!term) {
      nodes.push(sentence[index])
      index += 1
      continue
    }

    nodes.push(
      <span
        key={`${term.text}-${index}`}
        className={cn(
          "rounded-[3px] border-b-2 px-0.5 font-semibold",
          levelHighlightClass(term.level),
          term.type === "grammar" && "border-dashed"
        )}
        title={`${term.type === "grammar" ? "Ngữ pháp" : "Từ vựng"} ${term.level ?? ""}`.trim()}
      >
        {term.text}
      </span>
    )
    index += term.text.length
  }

  return nodes
}

function renderArticleToken(token: ArticleToken, terms: HighlightTerm[], showFurigana: boolean, key: string) {
  const content = renderHighlightedSentence(token.text, terms)

  if (!showFurigana || !token.reading) {
    return <span key={key}>{content}</span>
  }

  return (
    <ruby key={key} className="ruby-position-over">
      {content}
      <rt className="text-[11px] font-medium leading-none text-[#6f6f67]">{token.reading}</rt>
    </ruby>
  )
}

export function ReadingPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const articleIdFromUrl = searchParams.get("article")
  const [articles, setArticles] = useState<ReadingArticle[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [selectedLevel, setSelectedLevel] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [showFurigana, setShowFurigana] = useState(true)
  
  // Trạng thái Quiz quản lý theo ID bài đọc để không bị mất/xung đột khi đổi bài
  const [quiz, setQuiz] = useState<QuizState>({
    answers: {},
    submitted: {},
    currentIndex: {},
  })
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set())
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [deletingArticleId, setDeletingArticleId] = useState<string | null>(null)
  const { activeUser } = useAuth()
  const isAdmin = activeUser?.role === "admin"

  useEffect(() => {
    let cancelled = false

    async function loadArticles() {
      try {
        const response = await fetch("/api/reading", { cache: "no-store" })
        if (!response.ok) throw new Error("Không tải được bài đọc")
        const data = (await response.json()) as { items: ReadingArticle[] }
        if (cancelled) return
        setArticles(data.items)
        setSelectedId((current) => {
          if (current) return current
          if (articleIdFromUrl && data.items.some((article) => article.id === articleIdFromUrl)) return articleIdFromUrl
          return data.items[0]?.id ?? null
        })
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Không tải được bài đọc")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadArticles()

    return () => {
      cancelled = true
    }
  }, [articleIdFromUrl])

  useEffect(() => {
    let cancelled = false

    async function loadSavedItems() {
      try {
        const response = await fetch("/api/saved-study-items")
        if (!response.ok) return
        const data = (await response.json()) as { items: SavedStudyApiItem[] }
        if (!cancelled) setSavedKeys(new Set(data.items.map((item) => item.itemKey)))
      } catch {
        if (!cancelled) setSavedKeys(new Set())
      }
    }

    loadSavedItems()

    return () => {
      cancelled = true
    }
  }, [])

  const filteredArticles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return articles.filter((article) =>
      (selectedLevel === "all" || article.level === selectedLevel) &&
      (selectedCategory === "all" || article.category === selectedCategory) &&
      (!normalizedQuery ||
        `${article.title} ${article.articleText} ${article.level} ${article.category ?? ""}`
          .toLowerCase()
          .includes(normalizedQuery))
    )
  }, [articles, query, selectedCategory, selectedLevel])

  const availableLevels = useMemo(() => {
    const levels = Array.from(new Set(articles.map((article) => article.level).filter((level) => /^N[1-5]$/.test(level))))
    return levels.sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)))
  }, [articles])

  const availableCategories = useMemo(() => {
    return Array.from(new Set(articles.map((article) => article.category).filter((category): category is string => Boolean(category))))
  }, [articles])

  useEffect(() => {
    if (filteredArticles.length === 0) {
      setSelectedId(null)
      return
    }

    setSelectedId((current) => {
      if (articleIdFromUrl && filteredArticles.some((article) => article.id === articleIdFromUrl)) return articleIdFromUrl
      return current && filteredArticles.some((article) => article.id === current) ? current : filteredArticles[0].id
    })
  }, [articleIdFromUrl, filteredArticles])

  // Lấy dữ liệu bài đọc hiện tại
  const selectedArticle = filteredArticles.find((article) => article.id === selectedId) ?? filteredArticles[0] ?? null
  const articleId = selectedArticle?.id ?? ""
  
  const questions = asArray<QuestionItem>(selectedArticle?.questions)
  const totalQuestions = questions.length
  
  const vocabulary = asArray<StudyItem>(selectedArticle?.vocabulary)
  const grammar = asArray<StudyItem>(selectedArticle?.grammar)
  const levelStats = selectedArticle?.levelStats ?? []
  const highlightTerms = useMemo(() => {
    const crawledHighlights = uniqueHighlightTerms(selectedArticle?.highlights ?? [])
    if (crawledHighlights.length > 0) return crawledHighlights

    const vocabularyTerms = vocabulary
      .map(parseVocabularyItem)
      .filter((item) => item.word && item.level)
      .map((item) => ({
        text: item.word,
        level: item.level,
        type: "vocabulary" as const,
      }))

    const grammarTerms = grammar
      .map(parseGrammarItem)
      .filter((item) => item.pattern && item.level && /[\u3041-\u3096\u30a1-\u30ff\u4e00-\u9fff]/.test(item.pattern))
      .map((item) => ({
        text: item.pattern,
        level: item.level,
        type: "grammar" as const,
      }))

    return uniqueHighlightTerms([...vocabularyTerms, ...grammarTerms])
  }, [grammar, selectedArticle?.highlights, vocabulary])
  const otherArticles = selectedArticle
    ? filteredArticles.filter((article) => article.id !== selectedArticle.id)
    : []
  const sentences = splitJapaneseSentences(selectedArticle?.articleText ?? "")
  const articleBlocks = selectedArticle?.articleBlocks?.length ? selectedArticle.articleBlocks : null

  // Logic Index & Trạng thái làm bài
  const rawIndex = quiz.currentIndex[articleId] ?? 0
  const currentQuestionIndex = totalQuestions > 0 ? Math.min(Math.max(rawIndex, 0), totalQuestions - 1) : 0

  const getAnswerKey = (questionNumber: number) => `${articleId}:${questionNumber}`
  const isSubmitted = quiz.submitted[articleId] ?? false

  const score = questions.reduce((total, question, index) => {
    const selected = quiz.answers[getAnswerKey(index)]
    return selected && selected === question.correctAnswer ? total + 1 : total
  }, 0)

  // Handlers
  const chooseArticle = (id: string) => {
    setSelectedId(id)
  }

  const askAiAboutArticle = (article: ReadingArticle) => {
    const activeSource: ActiveChatSource = {
      type: "news",
      id: article.id,
      title: article.title,
    }

    window.sessionStorage.setItem(CHAT_ACTIVE_SOURCE_STORAGE_KEY, JSON.stringify(activeSource))
    router.push("/chatbot")
  }

  const goToPreviousQuestion = () => {
    if (!articleId) return
    setQuiz((prev) => ({
      ...prev,
      currentIndex: {
        ...prev.currentIndex,
        [articleId]: Math.max(0, currentQuestionIndex - 1),
      },
    }))
  }

  const goToNextQuestion = () => {
    if (!articleId) return
    setQuiz((prev) => ({
      ...prev,
      currentIndex: {
        ...prev.currentIndex,
        [articleId]: Math.min(totalQuestions - 1, currentQuestionIndex + 1),
      },
    }))
  }

  const chooseAnswer = (questionNumber: number, answerKey: string) => {
    if (!articleId || isSubmitted) return // Chặn sửa đáp án nếu đã nộp bài

    setQuiz((prev) => ({
      ...prev,
      answers: {
        ...prev.answers,
        [`${articleId}:${questionNumber}`]: answerKey,
      },
    }))
  }

  const submitQuiz = () => {
    if (!articleId || totalQuestions === 0) return
    setQuiz((prev) => ({
      ...prev,
      submitted: {
        ...prev.submitted,
        [articleId]: true,
      },
    }))
  }

  const saveStudyItem = async (
    payload: {
      type: "vocabulary" | "grammar"
      itemKey: string
      title: string
      reading?: string
      level?: string | null
      meaning?: string
      note?: string
      example?: string
      rawPayload: unknown
    },
  ) => {
    if (!selectedArticle) return

    setSavingKey(payload.itemKey)
    try {
      const response = await fetch("/api/saved-study-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...payload,
          sourceType: "todaii-news",
          sourceId: selectedArticle.id,
          level: payload.level ?? undefined,
        }),
      })

      if (!response.ok) throw new Error("Could not save item")
      setSavedKeys((current) => new Set([...current, payload.itemKey]))
    } finally {
      setSavingKey(null)
    }
  }

  const deleteArticle = async (article: ReadingArticle) => {
    if (!isAdmin || deletingArticleId) return
    const confirmed = window.confirm(`Xóa bài "${article.title}" khỏi hệ thống?`)
    if (!confirmed) return

    setDeletingArticleId(article.id)
    try {
      const response = await fetch(`/api/admin/news-articles/${article.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || "Không thể xóa bài báo")
      }

      setArticles((current) => current.filter((item) => item.id !== article.id))
      setSelectedId((current) => (current === article.id ? null : current))
    } catch (deleteError) {
      alert(deleteError instanceof Error ? deleteError.message : "Không thể xóa bài báo")
    } finally {
      setDeletingArticleId(null)
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-[calc(100vh-8rem)] place-items-center">
        <div className="text-sm text-muted-foreground">Đang tải bài đọc...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        {error}
      </div>
    )
  }

  if (!articles.length) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold">Chưa có bài đọc</h1>
        <p className="mt-2 text-sm text-muted-foreground">Mở TODAII và bấm extension crawler để import bài đầu tiên.</p>
      </div>
    )
  }

  return (
    <div className="-m-6 min-h-[calc(100vh-4rem)] bg-[#f7f7f4]">
      <div className="grid w-full gap-5 2xl:grid-cols-[330px_minmax(0,1fr)_300px] xl:grid-cols-[300px_minmax(0,1fr)_280px]">
        <aside className="space-y-4 p-4 md:p-6">
          <div className="rounded-lg border border-[#deded8] bg-white p-3 shadow-sm">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm bài đọc..."
                className="h-10 rounded-md pl-9"
              />
            </div>
          </div>

          <div className="space-y-4 rounded-lg border border-[#deded8] bg-white p-3 shadow-sm">
            <div>
              <h2 className="mb-2 text-sm font-semibold text-[#2a211f]">Trình độ</h2>
              <div className="flex flex-wrap gap-2">
                {["all", ...availableLevels].map((level) => (
                  <Button
                    key={level}
                    type="button"
                    variant={selectedLevel === level ? "default" : "secondary"}
                    size="sm"
                    className={cn(
                      "h-8 rounded-full px-3",
                      selectedLevel === level && (level === "all" ? "bg-[#24b26b] text-white hover:bg-[#1d9659]" : levelChipActiveClass(level))
                    )}
                    onClick={() => setSelectedLevel(level)}
                  >
                    {level === "all" ? "Tất cả" : level}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-2 text-sm font-semibold text-[#2a211f]">Chủ đề</h2>
              <div className="flex flex-wrap gap-2">
                {["all", ...availableCategories].map((category) => (
                  <Button
                    key={category}
                    type="button"
                    variant={selectedCategory === category ? "default" : "secondary"}
                    size="sm"
                    className={cn(
                      "h-8 rounded-full px-3",
                      selectedCategory === category && "bg-[#24b26b] text-white hover:bg-[#1d9659]"
                    )}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category === "all" ? "Tất cả" : category}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {filteredArticles.map((article) => {
              const active = selectedArticle?.id === article.id

              return (
                <button
                  key={article.id}
                  type="button"
                  onClick={() => chooseArticle(article.id)}
                  className={cn(
                    "w-full rounded-lg border bg-white p-3 text-left shadow-sm transition",
                    active ? "border-[#24b26b] ring-2 ring-[#24b26b]/15" : "border-[#deded8] hover:border-[#24b26b]/50"
                  )}
                >
                  <div className="flex gap-3">
                    <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-md bg-[#e7e7e2]">
                      {article.imageUrl ? (
                        <Image src={article.imageUrl} alt="" fill sizes="96px" className="object-cover" />
                      ) : (
                        <div className="grid h-full place-items-center text-xs text-muted-foreground">TODAII</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge className={cn("rounded px-1.5 py-0 text-xs", levelBadgeClass(article.level))}>
                          {article.level}
                        </Badge>
                        {article.category && <Badge variant="outline" className="rounded px-1.5 py-0 text-xs">{article.category}</Badge>}
                        <span className="text-xs text-muted-foreground">{formatDate(article.publishedAt)}</span>
                      </div>
                      <h2 className="mt-1 line-clamp-2 text-sm font-semibold leading-5">{article.title}</h2>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{articlePreview(article)}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        {selectedArticle && (
          <main className="min-w-0 space-y-5">
            <section className="overflow-hidden rounded-lg border border-[#deded8] bg-white shadow-sm">
              {selectedArticle.imageUrl && (
                <div className="relative aspect-video w-full bg-[#e7e7e2]">
                  <Image src={selectedArticle.imageUrl} alt="" fill priority sizes="100vw" className="object-cover" />
                </div>
              )}

              <div className="p-4 md:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={cn("rounded px-2 py-0.5", levelBadgeClass(selectedArticle.level))}>{selectedArticle.level}</Badge>
                  {selectedArticle.category && <Badge variant="outline" className="rounded px-2 py-0.5">{selectedArticle.category}</Badge>}
                  <span className="text-sm text-muted-foreground">{formatDate(selectedArticle.publishedAt)}</span>
                  <span className="text-sm text-muted-foreground">Nguồn: {selectedArticle.provider}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="ml-auto h-8 gap-1"
                    onClick={() => askAiAboutArticle(selectedArticle)}
                  >
                    <MessageSquare className="h-4 w-4" />
                    Hoi AI ve bai nay
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 gap-1" asChild>
                    <a href={selectedArticle.sourceUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      TODAII
                    </a>
                  </Button>
                  {isAdmin && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      disabled={deletingArticleId === selectedArticle.id}
                      onClick={() => deleteArticle(selectedArticle)}
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingArticleId === selectedArticle.id ? "Đang xóa" : "Xóa"}
                    </Button>
                  )}
                </div>

                <h1 className="mt-4 text-2xl font-bold leading-tight tracking-tight md:text-3xl">{selectedArticle.title}</h1>

                {levelStats.length > 0 && (
                  <div
                    key={`${selectedArticle.id}:level-stats`}
                    className="mt-4 grid grid-cols-2 gap-2 rounded-lg border border-[#e5e5df] bg-[#fbfbf8] p-3 sm:grid-cols-5"
                  >
                    {levelStats.map((stat) => (
                      <div key={stat.level} className="flex items-center justify-between gap-2 sm:justify-center">
                        <Badge className={cn("rounded px-2 py-0.5 text-xs", levelBadgeClass(stat.level))}>
                          {stat.level}
                        </Badge>
                        <span className="text-sm font-semibold text-[#2a211f] sm:text-base">
                          {stat.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {selectedArticle.audioUrl && (
                  <div className="mt-4 rounded-lg border border-[#e5e5df] bg-[#fbfbf8] p-3">
                    <audio controls preload="metadata" className="h-10 w-full" src={selectedArticle.audioUrl}>
                      Trình duyệt của bạn chưa hỗ trợ phát audio.
                    </audio>
                  </div>
                )}

                <div className="mt-5 rounded-lg border border-[#e5e5df] bg-[#fbfbf8] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Languages className="h-4 w-4 text-[#24b26b]" />
                      Dịch song ngữ
                    </div>
                    <Button
                      type="button"
                      variant={showFurigana ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "h-8 gap-1",
                        showFurigana && "bg-[#24b26b] text-white hover:bg-[#1d9659]"
                      )}
                      onClick={() => setShowFurigana((current) => !current)}
                    >
                      <ChevronDown className="h-4 w-4" />
                      Furigana
                    </Button>
                  </div>
                  <article className="space-y-3 font-['Noto_Sans_JP',sans-serif] text-[19px] leading-9 text-[#242424]">
                    {articleBlocks
                      ? articleBlocks.map((block, blockIndex) => (
                          <p key={`${block.text}-${blockIndex}`}>
                            {block.tokens.map((token, tokenIndex) =>
                              renderArticleToken(token, highlightTerms, showFurigana, `${blockIndex}-${tokenIndex}`)
                            )}
                          </p>
                        ))
                      : sentences.map((sentence, index) => (
                          <p key={`${sentence}-${index}`}>{renderHighlightedSentence(sentence, highlightTerms)}</p>
                        ))}
                  </article>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-[#deded8] bg-white p-4 shadow-sm md:p-6">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="flex items-center gap-2 text-xl font-semibold">
                  <FileQuestion className="h-5 w-5 text-[#24b26b]" />
                  Câu hỏi
                </h2>
                <div className="flex items-center gap-3">
                  {/* Sửa lại text hiển thị Đã chọn x/y để không bị dính chữ */}
                  <Button
                    type="button"
                    size="sm"
                    disabled={isSubmitted || totalQuestions === 0}
                    className="bg-[#24b26b] text-white hover:bg-[#1d9659] disabled:bg-muted disabled:text-muted-foreground"
                    onClick={submitQuiz}
                  >
                    {isSubmitted ? "Đã nộp" : "Nộp bài"}
                  </Button>
                </div>
              </div>

              {isSubmitted && (
                <div className="mb-4 rounded-lg border border-[#24b26b]/30 bg-[#ecf9f1] px-4 py-3 text-sm font-medium text-[#17683e]">
                  Kết quả: {score}/{totalQuestions}
                </div>
              )}

              {questions.length > 0 ? (
                <div className="space-y-4">
                  {questions.map((question, questionIndex) => {
                    const selectedAnswer = quiz.answers[getAnswerKey(questionIndex)]

                    return (
                      <Card key={`${question.question ?? question.rawText ?? questionIndex}-${questionIndex}`} className="border-[#e5e5df]">
                        <CardContent className="p-4">
                          <div className="mb-4 flex items-start justify-between gap-4">
                            <p className="font-['Noto_Sans_JP',sans-serif] text-lg font-semibold leading-8">
                              {question.question || question.rawText || `Câu hỏi ${questionIndex + 1}`}
                            </p>
                            <Badge variant="outline" className="shrink-0 rounded-full">
                              {questionIndex + 1}/{totalQuestions}
                            </Badge>
                          </div>
                          <div className="grid gap-3 md:grid-cols-2">
                            {(question.options?.length ? question.options : []).map((option) => {
                              const selected = selectedAnswer === option.key
                              const isCorrect = isSubmitted && option.key === question.correctAnswer
                              const isWrong = isSubmitted && selected && option.key !== question.correctAnswer

                              return (
                                <button
                                  key={option.key}
                                  type="button"
                                  disabled={isSubmitted}
                                  onClick={() => {
                                    if (!option.key) return
                                    chooseAnswer(questionIndex, option.key)
                                  }}
                                  className={cn(
                                    "flex items-center gap-3 rounded-lg border p-3 text-left transition",
                                    selected ? "border-[#24b26b] bg-[#ecf9f1]" : "border-[#e5e5df]",
                                    !isSubmitted && !selected && "hover:border-[#24b26b]/60",
                                    isSubmitted && "cursor-default opacity-90",
                                    isCorrect && "border-[#24b26b] bg-[#f3fbf6]",
                                    isWrong && "border-red-400 bg-red-50"
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "grid h-8 w-8 shrink-0 place-items-center rounded-full border text-sm font-semibold",
                                      selected ? "border-[#24b26b] bg-[#24b26b] text-white" : "border-[#bcbcb4]",
                                      isCorrect && !selected && "border-[#24b26b] text-[#17683e]",
                                      isWrong && "border-red-500 bg-red-500 text-white"
                                    )}
                                  >
                                    {selected ? <Check className="h-4 w-4" /> : option.key}
                                  </span>
                                  <span className="font-['Noto_Sans_JP',sans-serif] text-base">{option.text}</span>
                                </button>
                              )}
                            )}
                            {!question.options?.length && (
                              <p className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                                {question.rawText ?? "Crawler chưa tách được lựa chọn cho câu hỏi này."}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <p className="rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">Bài này chưa có dữ liệu câu hỏi.</p>
              )}
            </section>

            <section className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-lg border border-[#deded8] bg-white p-4 shadow-sm md:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-xl font-semibold">
                    <BookOpen className="h-5 w-5 text-[#24b26b]" />
                    Từ vựng ({vocabulary.length})
                  </h2>
                  <Button variant="ghost" size="sm">Thu gọn</Button>
                </div>
                <div className="grid gap-3">
                  {vocabulary.map((item, index) => {
                    const parsed = parseVocabularyItem(item)
                    const itemKey = `${articleId}:vocabulary:${parsed.word || index}`
                    const isSaved = savedKeys.has(itemKey)
                    const isSaving = savingKey === itemKey

                    return (
                      <div key={index} className="rounded-lg border border-[#e5e5df] bg-[#fbfbf8] p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                              <span className="font-['Noto_Sans_JP',sans-serif] text-lg font-semibold leading-7">
                                {parsed.word}
                              </span>
                              {parsed.reading && (
                                <span className="font-['Noto_Sans_JP',sans-serif] text-sm text-muted-foreground">
                                  {parsed.reading}
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                              {parsed.meaning && <span className="font-medium text-[#2a211f]">{parsed.meaning}</span>}
                              {parsed.partOfSpeech && <span className="text-muted-foreground">{parsed.partOfSpeech}</span>}
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-2">
                            {parsed.level && <Badge className={cn("rounded px-2 py-0.5", levelBadgeClass(parsed.level))}>{parsed.level}</Badge>}
                            <Button
                              type="button"
                              variant={isSaved ? "secondary" : "outline"}
                              size="sm"
                              className="h-8 gap-1"
                              disabled={isSaved || isSaving}
                              onClick={() =>
                                saveStudyItem({
                                  type: "vocabulary",
                                  itemKey,
                                  title: parsed.word,
                                  reading: parsed.reading,
                                  level: parsed.level,
                                  meaning: parsed.meaning,
                                  note: parsed.partOfSpeech,
                                  rawPayload: item,
                                })
                              }
                            >
                              {!isSaved && <Plus className="h-3.5 w-3.5" />}
                              {isSaved ? "Đã lưu" : isSaving ? "Đang lưu" : "Lưu học"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {!vocabulary.length && <p className="text-sm text-muted-foreground">Chưa có từ vựng.</p>}
                </div>
              </div>

              <div className="rounded-lg border border-[#deded8] bg-white p-4 shadow-sm md:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-xl font-semibold">
                    <ListChecks className="h-5 w-5 text-[#24b26b]" />
                    Ngữ pháp ({grammar.length})
                  </h2>
                  <Button variant="ghost" size="sm">Thu gọn</Button>
                </div>
                <div className="grid gap-3">
                  {grammar.map((item, index) => {
                    const parsed = parseGrammarItem(item)
                    const itemKey = `${articleId}:grammar:${parsed.pattern || index}`
                    const isSaved = savedKeys.has(itemKey)
                    const isSaving = savingKey === itemKey

                    return (
                      <div key={index} className="rounded-lg border border-[#e5e5df] bg-[#fbfbf8] p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 space-y-2">
                            <p className="text-base font-semibold leading-7 text-[#2a211f]">{parsed.pattern}</p>
                            {parsed.description && (
                              <p className="text-sm leading-6 text-muted-foreground">{parsed.description}</p>
                            )}
                            {parsed.example && (
                              <p className="rounded-md bg-white px-3 py-2 font-['Noto_Sans_JP',sans-serif] text-sm leading-7 text-[#242424]">
                                {parsed.example}
                              </p>
                            )}
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-2">
                            {parsed.level && <Badge className={cn("rounded px-2 py-0.5", levelBadgeClass(parsed.level))}>{parsed.level}</Badge>}
                            <Button
                              type="button"
                              variant={isSaved ? "secondary" : "outline"}
                              size="sm"
                              className="h-8 gap-1"
                              disabled={isSaved || isSaving}
                              onClick={() =>
                                saveStudyItem({
                                  type: "grammar",
                                  itemKey,
                                  title: parsed.pattern,
                                  level: parsed.level,
                                  meaning: parsed.description,
                                  example: parsed.example,
                                  rawPayload: item,
                                })
                              }
                            >
                              {!isSaved && <Plus className="h-3.5 w-3.5" />}
                              {isSaved ? "Đã lưu" : isSaving ? "Đang lưu" : "Lưu học"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {!grammar.length && <p className="text-sm text-muted-foreground">Chưa có ngữ pháp.</p>}
                </div>
              </div>
            </section>
          </main>
        )}

        {selectedArticle && (
          <aside className="space-y-4 p-4 md:p-6 xl:pl-0">
            <div className="sticky top-20 space-y-3">
              <div className="rounded-lg border border-[#deded8] bg-white p-4 shadow-sm">
                <h2 className="text-base font-semibold text-[#2a211f]">Bài đọc khác</h2>
                <p className="mt-1 text-sm text-muted-foreground">Đọc tiếp các bài song ngữ đã import.</p>
              </div>

              {otherArticles.length > 0 ? (
                otherArticles.map((article) => {
                const active = selectedArticle.id === article.id

                return (
                  <button
                    key={article.id}
                    type="button"
                    onClick={() => chooseArticle(article.id)}
                    className={cn(
                      "w-full rounded-lg border bg-white p-3 text-left shadow-sm transition",
                      active ? "border-[#24b26b] ring-2 ring-[#24b26b]/15" : "border-[#deded8] hover:border-[#24b26b]/50"
                    )}
                  >
                    <div className="space-y-3">
                      <div className="relative aspect-video w-full overflow-hidden rounded-md bg-[#e7e7e2]">
                        {article.imageUrl ? (
                          <Image src={article.imageUrl} alt="" fill sizes="280px" className="object-cover" />
                        ) : (
                          <div className="grid h-full place-items-center text-xs text-muted-foreground">TODAII</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge className={cn("rounded px-1.5 py-0 text-xs", levelBadgeClass(article.level))}>
                            {article.level}
                          </Badge>
                        {article.category && <Badge variant="outline" className="rounded px-1.5 py-0 text-xs">{article.category}</Badge>}
                        <span className="text-xs text-muted-foreground">{formatDate(article.publishedAt)}</span>
                        </div>
                        <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-5">{article.title}</h3>
                        <p className="mt-1 line-clamp-3 text-xs leading-5 text-muted-foreground">{articlePreview(article)}</p>
                      </div>
                    </div>
                  </button>
                )
                })
              ) : (
                <div className="rounded-lg border border-dashed border-[#deded8] bg-white p-4 text-sm text-muted-foreground">
                  Không có bài khác trong danh sách hiện tại.
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
