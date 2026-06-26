"use client"

import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import {
  BookOpen,
  CheckCircle2,
  FileText,
  Home,
  PlayCircle,
  RotateCcw,
  Shuffle,
  Trophy,
  XCircle,
} from "lucide-react"
import { QuizQuestion } from "@/components/app/quiz-question"
import { ContentErrorAlert } from "@/components/app/content-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useActivityLog } from "@/hooks/use-activity-log"
import { useAdminContent } from "@/hooks/use-admin-content"
import { useStudyProgress } from "@/hooks/use-study-progress"
import type { GrammarItem, QuizQuestionItem, VocabularyItem } from "@/lib/data/nihongo-study"
import { isUsefulSavedStudyItem, type SavedStudyItem } from "@/lib/saved-study-items"
import { cn } from "@/lib/utils"

type QuizState = "setup" | "playing" | "result"
type QuizType = "vocabulary" | "grammar" | "mixed"
type QuestionMode = "auto" | "meaning" | "reading" | "grammar-meaning" | "grammar-structure" | "saved"
type DifficultyFilter = "all" | "easy" | "medium" | "hard"

type QuizResult = {
  score: number
  total: number
  percentage: number
}

const paperCardStyle = {
  backgroundColor: "transparent",
  backgroundImage: "url('/assets/paper-card-bg-clean.png')",
  backgroundRepeat: "no-repeat",
  backgroundSize: "100% 100%",
  backgroundPosition: "center",
} as const

const difficultyLabels: Record<QuizQuestionItem["difficulty"], string> = {
  easy: "Dễ",
  medium: "Trung bình",
  hard: "Khó",
}

const grammarDifficultyToQuizDifficulty: Record<GrammarItem["difficulty"], QuizQuestionItem["difficulty"]> = {
  "Dễ": "easy",
  "Trung bình": "medium",
  "Khó": "hard",
}

function shuffle<T>(items: T[]) {
  const nextItems = [...items]

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const current = nextItems[index]
    nextItems[index] = nextItems[swapIndex]
    nextItems[swapIndex] = current
  }

  return nextItems
}

function pickDistractors(correct: string, candidates: string[], count = 3) {
  return shuffle(Array.from(new Set(candidates.filter((candidate) => candidate && candidate !== correct)))).slice(0, count)
}

function toAnswers(correct: string, distractors: string[]) {
  return shuffle([correct, ...distractors]).map((text, index) => ({
    id: String.fromCharCode(97 + index),
    text,
    isCorrect: text === correct,
  }))
}

function buildVocabularyMeaningQuestions(vocabulary: VocabularyItem[]): QuizQuestionItem[] {
  const meanings = vocabulary.map((item) => item.vietnamese)

  return vocabulary.map((item) => {
    const answers = toAnswers(item.vietnamese, pickDistractors(item.vietnamese, meanings))
    const correctAnswer = answers.find((answer) => answer.isCorrect)?.id ?? "a"

    return {
      id: 100000 + item.id,
      question: `"${item.japanese}" nghĩa là gì?`,
      type: "vocabulary",
      difficulty: "easy",
      topic: item.topic,
      answers: answers.map(({ id, text }) => ({ id, text })),
      correctAnswer,
      explanation: `${item.japanese} (${item.hiragana} / ${item.romaji}) nghĩa là ${item.vietnamese}.`,
    }
  })
}

function buildVocabularyReadingQuestions(vocabulary: VocabularyItem[]): QuizQuestionItem[] {
  const readings = vocabulary.map((item) => item.romaji)

  return vocabulary.map((item) => {
    const answers = toAnswers(item.romaji, pickDistractors(item.romaji, readings))
    const correctAnswer = answers.find((answer) => answer.isCorrect)?.id ?? "a"

    return {
      id: 200000 + item.id,
      question: `Chọn cách đọc romaji đúng của "${item.japanese}"`,
      type: "vocabulary",
      difficulty: "easy",
      topic: item.topic,
      answers: answers.map(({ id, text }) => ({ id, text })),
      correctAnswer,
      explanation: `${item.japanese} đọc là ${item.hiragana} (${item.romaji}).`,
    }
  })
}

function buildGrammarMeaningQuestions(grammar: GrammarItem[]): QuizQuestionItem[] {
  const meanings = grammar.map((item) => item.meaning)

  return grammar.map((item) => {
    const answers = toAnswers(item.meaning, pickDistractors(item.meaning, meanings))
    const correctAnswer = answers.find((answer) => answer.isCorrect)?.id ?? "a"

    return {
      id: 300000 + item.id,
      question: `Mẫu "${item.pattern}" dùng để diễn đạt gì?`,
      type: "grammar",
      difficulty: grammarDifficultyToQuizDifficulty[item.difficulty],
      topic: "Ngữ pháp N5",
      answers: answers.map(({ id, text }) => ({ id, text })),
      correctAnswer,
      explanation: `${item.pattern}: ${item.meaning}. ${item.usageNote}`,
    }
  })
}

function buildGrammarStructureQuestions(grammar: GrammarItem[]): QuizQuestionItem[] {
  const structures = grammar.map((item) => item.structure)

  return grammar.map((item) => {
    const answers = toAnswers(item.structure, pickDistractors(item.structure, structures))
    const correctAnswer = answers.find((answer) => answer.isCorrect)?.id ?? "a"

    return {
      id: 400000 + item.id,
      question: `Chọn cấu trúc đúng cho "${item.pattern}"`,
      type: "grammar",
      difficulty: grammarDifficultyToQuizDifficulty[item.difficulty],
      topic: "Ngữ pháp N5",
      answers: answers.map(({ id, text }) => ({ id, text })),
      correctAnswer,
      explanation: `Cấu trúc: ${item.structure}. Ví dụ: ${item.example.japanese} - ${item.example.vietnamese}`,
    }
  })
}

function savedItemDifficulty(level: string): QuizQuestionItem["difficulty"] {
  if (level === "N5") return "easy"
  if (level === "N4") return "medium"
  return "hard"
}

function buildSavedStudyQuestions(
  savedItems: SavedStudyItem[],
  vocabulary: VocabularyItem[],
  grammar: GrammarItem[]
): QuizQuestionItem[] {
  const usefulItems = savedItems.filter(isUsefulSavedStudyItem)
  const vocabularyMeanings = [
    ...usefulItems.filter((item) => item.type === "vocabulary").map((item) => item.meaning),
    ...vocabulary.map((item) => item.vietnamese),
  ]
  const grammarMeanings = [
    ...usefulItems.filter((item) => item.type === "grammar").map((item) => item.meaning),
    ...grammar.map((item) => item.meaning),
  ]

  return usefulItems.flatMap((item, index) => {
    const correct = item.meaning.trim()
    if (!correct) return []

    const candidates = item.type === "vocabulary" ? vocabularyMeanings : grammarMeanings
    const distractors = pickDistractors(correct, candidates)
    if (distractors.length < 2) return []

    const answers = toAnswers(correct, distractors)
    const correctAnswer = answers.find((answer) => answer.isCorrect)?.id ?? "a"
    const detail = [item.reading, item.note, item.example].filter(Boolean).join(" · ")

    return [{
      id: 700000 + index,
      question:
        item.type === "vocabulary"
          ? `“${item.title}” nghĩa là gì?`
          : `Mẫu “${item.title}” dùng để diễn đạt gì?`,
      type: item.type,
      difficulty: savedItemDifficulty(item.level),
      topic: "Ôn tập đã lưu",
      answers: answers.map(({ id, text }) => ({ id, text })),
      correctAnswer,
      explanation: `${item.title}: ${correct}.${detail ? ` ${detail}` : ""}`,
    }]
  })
}

function buildQuestionPool({
  vocabulary,
  grammar,
  seedQuiz,
  savedItems,
  mode,
  quizType,
  difficulty,
}: {
  vocabulary: VocabularyItem[]
  grammar: GrammarItem[]
  seedQuiz: QuizQuestionItem[]
  savedItems: SavedStudyItem[]
  mode: QuestionMode
  quizType: QuizType
  difficulty: DifficultyFilter
}) {
  const pools: QuizQuestionItem[] = []
  const shouldUseVocabulary = quizType === "vocabulary" || quizType === "mixed"
  const shouldUseGrammar = quizType === "grammar" || quizType === "mixed"

  if (mode === "auto") {
    pools.push(...seedQuiz)
  }

  if (mode === "saved" || mode === "auto") {
    pools.push(...buildSavedStudyQuestions(savedItems, vocabulary, grammar))
  }

  if (shouldUseVocabulary && (mode === "auto" || mode === "meaning")) {
    pools.push(...buildVocabularyMeaningQuestions(vocabulary))
  }

  if (shouldUseVocabulary && (mode === "auto" || mode === "reading")) {
    pools.push(...buildVocabularyReadingQuestions(vocabulary))
  }

  if (shouldUseGrammar && (mode === "auto" || mode === "grammar-meaning")) {
    pools.push(...buildGrammarMeaningQuestions(grammar))
  }

  if (shouldUseGrammar && (mode === "auto" || mode === "grammar-structure")) {
    pools.push(...buildGrammarStructureQuestions(grammar))
  }

  return pools.filter((question) => {
    const matchesType = quizType === "mixed" || question.type === quizType
    const matchesDifficulty = difficulty === "all" || question.difficulty === difficulty
    return matchesType && matchesDifficulty
  })
}

export default function QuizPage() {
  const [quizState, setQuizState] = useState<QuizState>("setup")
  const [quizType, setQuizType] = useState<QuizType>("mixed")
  const [questionMode, setQuestionMode] = useState<QuestionMode>("auto")
  const [questionCount, setQuestionCount] = useState("10")
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all")
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({})
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestionItem[]>([])
  const [finalResult, setFinalResult] = useState<QuizResult>({ score: 0, total: 0, percentage: 0 })
  const [savedItems, setSavedItems] = useState<SavedStudyItem[]>([])
  const [savedItemsLoaded, setSavedItemsLoaded] = useState(false)
  const { recordQuizAttempt } = useStudyProgress()
  const { content, isLoaded, error } = useAdminContent()
  const { addActivity } = useActivityLog()

  useEffect(() => {
    const requestedMode = new URLSearchParams(window.location.search).get("mode")
    if (requestedMode === "saved") setQuestionMode("saved")

    let cancelled = false
    fetch("/api/saved-study-items", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Không tải được mục đã lưu")
        return response.json() as Promise<{ items: SavedStudyItem[] }>
      })
      .then((data) => {
        if (!cancelled) setSavedItems(data.items.filter(isUsefulSavedStudyItem))
      })
      .catch(() => {
        if (!cancelled) setSavedItems([])
      })
      .finally(() => {
        if (!cancelled) setSavedItemsLoaded(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const questionPool = useMemo(
    () =>
      buildQuestionPool({
        vocabulary: content.vocabulary,
        grammar: content.grammar,
        seedQuiz: content.quiz,
        savedItems,
        mode: questionMode,
        quizType,
        difficulty,
      }),
    [content.grammar, content.quiz, content.vocabulary, difficulty, questionMode, quizType, savedItems]
  )

  const availableCount = questionPool.length
  const selectedCount = Math.min(Number(questionCount), availableCount)

  const startQuiz = () => {
    const nextQuestions = shuffle(questionPool).slice(0, selectedCount)

    setQuizQuestions(nextQuestions)
    setQuizState("playing")
    setCurrentQuestion(0)
    setSelectedAnswers({})
    setFinalResult({ score: 0, total: nextQuestions.length, percentage: 0 })
  }

  const handleSelectAnswer = (answerId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion]: answerId,
    }))
  }

  const submitQuiz = () => {
    const score = quizQuestions.reduce((total, question, index) => {
      return total + (selectedAnswers[index] === question.correctAnswer ? 1 : 0)
    }, 0)
    const total = quizQuestions.length
    const percentage = total ? Math.round((score / total) * 100) : 0
    const result = { score, total, percentage }

    setFinalResult(result)
    recordQuizAttempt(quizType, result)
    addActivity({
      type: "quiz",
      content: `Hoàn thành quiz ${quizType === "vocabulary" ? "từ vựng" : quizType === "grammar" ? "ngữ pháp" : "tổng hợp"}`,
      topic: quizQuestions[0]?.topic,
      result: `${score}/${total} câu đúng`,
      score: percentage,
      durationMinutes: Math.max(3, Math.round(total * 1.5)),
    })
    setQuizState("result")
  }

  const handleNext = () => {
    if (currentQuestion === quizQuestions.length - 1) {
      submitQuiz()
    } else {
      setCurrentQuestion((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1)
    }
  }

  if (quizState === "setup") {
    return (
      <div className="-m-6 min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_8%_12%,rgba(243,200,189,0.55),transparent_28%),linear-gradient(135deg,#fff8f1_0%,#fffdf8_50%,#f7d9d2_100%)] p-6">
        <div className="space-y-6">
          <section className="relative overflow-hidden rounded-xl bg-[#fff8f1]/85 px-6 py-5">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px] md:items-center">
              <div className="relative max-w-2xl">
                <h1 className="text-3xl font-bold tracking-tight text-[#2a211f]">Quiz N5</h1>
                <p className="mt-2 text-base leading-7 text-[#4f403b]">
                  Tạo quiz động từ kho từ vựng và ngữ pháp hiện có. Mỗi lần bắt đầu sẽ trộn câu hỏi và đáp án mới.
                </p>
              </div>
              <div className="hidden h-40 items-center justify-center md:flex">
                <Image
                  src="/assets/quiz-card-clean.png"
                  alt=""
                  width={260}
                  height={220}
                  aria-hidden="true"
                  className="h-40 w-48 object-contain drop-shadow-[0_10px_18px_rgba(143,71,66,0.18)]"
                />
              </div>
            </div>
          </section>

          {error && <ContentErrorAlert message={error} />}

          <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="rounded-xl px-8 py-8 sm:px-10 sm:py-10" style={paperCardStyle}>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-[#2a211f]">Thiết lập bài kiểm tra</h2>
                <p className="text-sm leading-6 text-[#6f5952]">
                  Chọn phạm vi, dạng câu hỏi, số câu và độ khó phù hợp với buổi học.
                </p>
              </div>

              <div className="mt-6 space-y-5">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-[#2a211f]">Loại quiz</label>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { value: "vocabulary", label: "Từ vựng", icon: BookOpen },
                      { value: "grammar", label: "Ngữ pháp", icon: FileText },
                      { value: "mixed", label: "Tổng hợp", icon: Shuffle },
                    ].map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setQuizType(type.value as QuizType)}
                        className={cn(
                          "flex min-h-20 items-center gap-3 rounded-xl border-2 bg-white/55 p-3 text-left transition-all sm:flex-col sm:justify-center sm:text-center",
                          quizType === type.value
                            ? "border-[#702f2a] bg-[#f4d8d1]/55"
                            : "border-[#dfb6aa] hover:border-[#8f4742]"
                        )}
                      >
                        <type.icon className={cn("h-6 w-6", quizType === type.value ? "text-[#702f2a]" : "text-[#8f4742]")} />
                        <span className="text-sm font-medium leading-5">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-[#2a211f]">Dạng câu hỏi</label>
                    <Select value={questionMode} onValueChange={(value) => setQuestionMode(value as QuestionMode)}>
                      <SelectTrigger className="border-[#dfb6aa] bg-white/70">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Tự trộn</SelectItem>
                        <SelectItem value="meaning">Nghĩa từ vựng</SelectItem>
                        <SelectItem value="reading">Cách đọc từ</SelectItem>
                        <SelectItem value="grammar-meaning">Nghĩa ngữ pháp</SelectItem>
                        <SelectItem value="grammar-structure">Cấu trúc ngữ pháp</SelectItem>
                        <SelectItem value="saved">Mục đã lưu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-[#2a211f]">Số câu hỏi</label>
                    <Select value={questionCount} onValueChange={setQuestionCount}>
                      <SelectTrigger className="border-[#dfb6aa] bg-white/70">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 câu</SelectItem>
                        <SelectItem value="10">10 câu</SelectItem>
                        <SelectItem value="20">20 câu</SelectItem>
                        <SelectItem value="30">30 câu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-[#2a211f]">Độ khó</label>
                    <Select value={difficulty} onValueChange={(value) => setDifficulty(value as DifficultyFilter)}>
                      <SelectTrigger className="border-[#dfb6aa] bg-white/70">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="easy">Dễ</SelectItem>
                        <SelectItem value="medium">Trung bình</SelectItem>
                        <SelectItem value="hard">Khó</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  data-i18n-managed
                  onClick={startQuiz}
                  className="w-full rounded-full bg-[#702f2a] text-white hover:bg-[#5d2723]"
                  size="lg"
                  disabled={!isLoaded || !savedItemsLoaded || selectedCount === 0}
                >
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Bắt đầu {selectedCount ? `${selectedCount} câu` : "làm quiz"}
                </Button>

                {(!isLoaded || !savedItemsLoaded) && <p className="text-center text-sm text-muted-foreground">Đang tải câu hỏi...</p>}
                {isLoaded && savedItemsLoaded && selectedCount === 0 && (
                  <p className="text-center text-sm text-muted-foreground">
                    Chưa có câu hỏi phù hợp với lựa chọn này. Thử đổi dạng câu hỏi hoặc chọn độ khó "Tất cả".
                  </p>
                )}
              </div>
            </section>

            <Card className="border-[#dfb6aa] bg-[#fffdf8]/95 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Nguồn câu hỏi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-lg bg-[#fff8f1] px-4 py-3">
                  <span>Từ vựng</span>
                  <strong>{content.vocabulary.length}</strong>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[#fff8f1] px-4 py-3">
                  <span>Ngữ pháp</span>
                  <strong>{content.grammar.length}</strong>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[#fff8f1] px-4 py-3">
                  <span>Câu seed</span>
                  <strong>{content.quiz.length}</strong>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[#dcebd9]/70 px-4 py-3 text-[#315d41]">
                  <span>Pool hiện tại</span>
                  <strong>{availableCount}</strong>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (quizState === "result") {
    const { score, total, percentage } = finalResult

    return (
      <div className="-m-6 min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_8%_12%,rgba(243,200,189,0.55),transparent_28%),linear-gradient(135deg,#fff8f1_0%,#fffdf8_50%,#f7d9d2_100%)] p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <Card className="border-none bg-transparent text-center shadow-none" style={paperCardStyle}>
            <CardContent className="pb-6 pt-8">
              <div className="mb-6">
                <Trophy className={cn("mx-auto h-16 w-16", percentage >= 80 ? "text-yellow-500" : percentage >= 60 ? "text-gray-400" : "text-orange-400")} />
              </div>
              <h2 className="mb-2 text-3xl font-bold">Kết quả</h2>
              <div className="mb-4 text-6xl font-bold text-[#702f2a]">{percentage}%</div>
              <div className="flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <span>{score} câu đúng</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-destructive" />
                  <span>{total - score} câu sai</span>
                </div>
              </div>
              <Progress value={percentage} className="mt-6 h-2" />
            </CardContent>
          </Card>

          <Card className="border-[#dfb6aa] bg-[#fffdf8]/95 shadow-sm">
            <CardHeader>
              <CardTitle>Chi tiết câu trả lời</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {quizQuestions.map((question, index) => {
                const isCorrect = selectedAnswers[index] === question.correctAnswer
                return (
                  <div key={`${question.id}-${index}`} className={cn("rounded-xl border p-4", isCorrect ? "border-[#9cc8aa] bg-[#dcebd9]/60" : "border-[#e3a8a0] bg-[#f4d8d1]/55")}>
                    <div className="flex items-start gap-3">
                      {isCorrect ? (
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                      ) : (
                        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                      )}
                      <div className="space-y-2">
                        <p className="font-medium">Câu {index + 1}: {question.question}</p>
                        <p className="text-sm text-muted-foreground">
                          Đáp án đúng: {question.answers.find((answer) => answer.id === question.correctAnswer)?.text}
                        </p>
                        <p className="text-sm">{question.explanation}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button variant="outline" className="flex-1 rounded-full border-[#dfb6aa] bg-white/70 text-[#702f2a] hover:bg-white" onClick={() => setQuizState("setup")}>
              <Home className="mr-2 h-4 w-4" />
              Về trang quiz
            </Button>
            <Button className="flex-1 rounded-full bg-[#702f2a] text-white hover:bg-[#5d2723]" onClick={startQuiz}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Làm bộ mới
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const question = quizQuestions[currentQuestion]

  if (!question) {
    return null
  }

  return (
    <div className="-m-6 min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_8%_12%,rgba(243,200,189,0.55),transparent_28%),linear-gradient(135deg,#fff8f1_0%,#fffdf8_50%,#f7d9d2_100%)] p-6">
      <QuizQuestion
        questionNumber={currentQuestion + 1}
        totalQuestions={quizQuestions.length}
        question={question.question}
        answers={question.answers}
        selectedAnswer={selectedAnswers[currentQuestion]}
        onSelectAnswer={handleSelectAnswer}
        onPrevious={handlePrevious}
        onNext={handleNext}
        canGoPrevious={currentQuestion > 0}
        canGoNext={selectedAnswers[currentQuestion] !== undefined}
      />
    </div>
  )
}
