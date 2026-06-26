"use client"

import { useEffect, useRef, useState } from "react"
import { CheckCircle2, Clock3, RotateCcw, Trophy, Volume2, XCircle, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

type KanaCell = {
  kana: string
  romaji: string
}

type KanaQuizMode = "hiragana" | "katakana" | "mixed"

type KanaQuestion = KanaCell & {
  id: string
  script: Exclude<KanaQuizMode, "mixed">
  options: string[]
}

const gojuonRows: { label: string; hiragana: KanaCell[]; katakana: KanaCell[] }[] = [
  {
    label: "Nguyên âm",
    hiragana: [
      { kana: "あ", romaji: "a" },
      { kana: "い", romaji: "i" },
      { kana: "う", romaji: "u" },
      { kana: "え", romaji: "e" },
      { kana: "お", romaji: "o" },
    ],
    katakana: [
      { kana: "ア", romaji: "a" },
      { kana: "イ", romaji: "i" },
      { kana: "ウ", romaji: "u" },
      { kana: "エ", romaji: "e" },
      { kana: "オ", romaji: "o" },
    ],
  },
  {
    label: "Hàng K",
    hiragana: [
      { kana: "か", romaji: "ka" },
      { kana: "き", romaji: "ki" },
      { kana: "く", romaji: "ku" },
      { kana: "け", romaji: "ke" },
      { kana: "こ", romaji: "ko" },
    ],
    katakana: [
      { kana: "カ", romaji: "ka" },
      { kana: "キ", romaji: "ki" },
      { kana: "ク", romaji: "ku" },
      { kana: "ケ", romaji: "ke" },
      { kana: "コ", romaji: "ko" },
    ],
  },
  {
    label: "Hàng S",
    hiragana: [
      { kana: "さ", romaji: "sa" },
      { kana: "し", romaji: "shi" },
      { kana: "す", romaji: "su" },
      { kana: "せ", romaji: "se" },
      { kana: "そ", romaji: "so" },
    ],
    katakana: [
      { kana: "サ", romaji: "sa" },
      { kana: "シ", romaji: "shi" },
      { kana: "ス", romaji: "su" },
      { kana: "セ", romaji: "se" },
      { kana: "ソ", romaji: "so" },
    ],
  },
  {
    label: "Hàng T",
    hiragana: [
      { kana: "た", romaji: "ta" },
      { kana: "ち", romaji: "chi" },
      { kana: "つ", romaji: "tsu" },
      { kana: "て", romaji: "te" },
      { kana: "と", romaji: "to" },
    ],
    katakana: [
      { kana: "タ", romaji: "ta" },
      { kana: "チ", romaji: "chi" },
      { kana: "ツ", romaji: "tsu" },
      { kana: "テ", romaji: "te" },
      { kana: "ト", romaji: "to" },
    ],
  },
  {
    label: "Hàng N",
    hiragana: [
      { kana: "な", romaji: "na" },
      { kana: "に", romaji: "ni" },
      { kana: "ぬ", romaji: "nu" },
      { kana: "ね", romaji: "ne" },
      { kana: "の", romaji: "no" },
    ],
    katakana: [
      { kana: "ナ", romaji: "na" },
      { kana: "ニ", romaji: "ni" },
      { kana: "ヌ", romaji: "nu" },
      { kana: "ネ", romaji: "ne" },
      { kana: "ノ", romaji: "no" },
    ],
  },
  {
    label: "Hàng H",
    hiragana: [
      { kana: "は", romaji: "ha" },
      { kana: "ひ", romaji: "hi" },
      { kana: "ふ", romaji: "fu" },
      { kana: "へ", romaji: "he" },
      { kana: "ほ", romaji: "ho" },
    ],
    katakana: [
      { kana: "ハ", romaji: "ha" },
      { kana: "ヒ", romaji: "hi" },
      { kana: "フ", romaji: "fu" },
      { kana: "ヘ", romaji: "he" },
      { kana: "ホ", romaji: "ho" },
    ],
  },
  {
    label: "Hàng M",
    hiragana: [
      { kana: "ま", romaji: "ma" },
      { kana: "み", romaji: "mi" },
      { kana: "む", romaji: "mu" },
      { kana: "め", romaji: "me" },
      { kana: "も", romaji: "mo" },
    ],
    katakana: [
      { kana: "マ", romaji: "ma" },
      { kana: "ミ", romaji: "mi" },
      { kana: "ム", romaji: "mu" },
      { kana: "メ", romaji: "me" },
      { kana: "モ", romaji: "mo" },
    ],
  },
  {
    label: "Hàng Y",
    hiragana: [
      { kana: "や", romaji: "ya" },
      { kana: "", romaji: "" },
      { kana: "ゆ", romaji: "yu" },
      { kana: "", romaji: "" },
      { kana: "よ", romaji: "yo" },
    ],
    katakana: [
      { kana: "ヤ", romaji: "ya" },
      { kana: "", romaji: "" },
      { kana: "ユ", romaji: "yu" },
      { kana: "", romaji: "" },
      { kana: "ヨ", romaji: "yo" },
    ],
  },
  {
    label: "Hàng R",
    hiragana: [
      { kana: "ら", romaji: "ra" },
      { kana: "り", romaji: "ri" },
      { kana: "る", romaji: "ru" },
      { kana: "れ", romaji: "re" },
      { kana: "ろ", romaji: "ro" },
    ],
    katakana: [
      { kana: "ラ", romaji: "ra" },
      { kana: "リ", romaji: "ri" },
      { kana: "ル", romaji: "ru" },
      { kana: "レ", romaji: "re" },
      { kana: "ロ", romaji: "ro" },
    ],
  },
  {
    label: "Hàng W",
    hiragana: [
      { kana: "わ", romaji: "wa" },
      { kana: "", romaji: "" },
      { kana: "", romaji: "" },
      { kana: "", romaji: "" },
      { kana: "を", romaji: "wo" },
    ],
    katakana: [
      { kana: "ワ", romaji: "wa" },
      { kana: "", romaji: "" },
      { kana: "", romaji: "" },
      { kana: "", romaji: "" },
      { kana: "ヲ", romaji: "wo" },
    ],
  },
  {
    label: "Âm N",
    hiragana: [
      { kana: "ん", romaji: "n" },
      { kana: "", romaji: "" },
      { kana: "", romaji: "" },
      { kana: "", romaji: "" },
      { kana: "", romaji: "" },
    ],
    katakana: [
      { kana: "ン", romaji: "n" },
      { kana: "", romaji: "" },
      { kana: "", romaji: "" },
      { kana: "", romaji: "" },
      { kana: "", romaji: "" },
    ],
  },
]

const dakutenRows: { label: string; hiragana: KanaCell[]; katakana: KanaCell[] }[] = [
  {
    label: "G/Z/D/B/P",
    hiragana: "が ぎ ぐ げ ご ざ じ ず ぜ ぞ だ ぢ づ で ど ば び ぶ べ ぼ ぱ ぴ ぷ ぺ ぽ"
      .split(" ")
      .map((kana) => ({ kana, romaji: "" })),
    katakana: "ガ ギ グ ゲ ゴ ザ ジ ズ ゼ ゾ ダ ヂ ヅ デ ド バ ビ ブ ベ ボ パ ピ プ ペ ポ"
      .split(" ")
      .map((kana) => ({ kana, romaji: "" })),
  },
]

const yoonRows: { label: string; hiragana: KanaCell[]; katakana: KanaCell[] }[] = [
  {
    label: "Âm ghép",
    hiragana: "きゃ きゅ きょ しゃ しゅ しょ ちゃ ちゅ ちょ にゃ にゅ にょ ひゃ ひゅ ひょ みゃ みゅ みょ りゃ りゅ りょ"
      .split(" ")
      .map((kana) => ({ kana, romaji: "" })),
    katakana: "キャ キュ キョ シャ シュ ショ チャ チュ チョ ニャ ニュ ニョ ヒャ ヒュ ヒョ ミャ ミュ ミョ リャ リュ リョ"
      .split(" ")
      .map((kana) => ({ kana, romaji: "" })),
  },
]

function shuffle<T>(items: T[]) {
  const next = [...items]
  for (let index = next.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[next[index], next[randomIndex]] = [next[randomIndex], next[index]]
  }
  return next
}

function createKanaQuestions(mode: KanaQuizMode, count = 10): KanaQuestion[] {
  const scripts: Exclude<KanaQuizMode, "mixed">[] = mode === "mixed" ? ["hiragana", "katakana"] : [mode]
  const pool = scripts.flatMap((script) =>
    gojuonRows.flatMap((row) =>
      row[script]
        .filter((cell) => cell.kana && cell.romaji)
        .map((cell) => ({ ...cell, script }))
    )
  )
  const romajiPool = [...new Set(pool.map((cell) => cell.romaji))]

  return shuffle(pool)
    .slice(0, count)
    .map((cell, index) => {
      const distractors = shuffle(romajiPool.filter((romaji) => romaji !== cell.romaji)).slice(0, 3)
      const options = shuffle([cell.romaji, ...distractors])

      // Giữ đáp án đúng như một invariant của câu hỏi, kể cả khi dữ liệu được đổi sau này.
      if (!options.includes(cell.romaji)) options[0] = cell.romaji

      return {
        ...cell,
        id: `${cell.script}-${cell.kana}-${index}`,
        options,
      }
    })
}

function safeAnswerOptions(question: KanaQuestion) {
  if (question.options.includes(question.romaji)) return question.options
  return [question.romaji, ...question.options.filter((option) => option !== question.romaji)].slice(0, 4)
}

function speak(text: string) {
  if (!text || typeof window === "undefined" || !("speechSynthesis" in window)) return

  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = "ja-JP"
  utterance.rate = 0.75
  const voice = window.speechSynthesis.getVoices().find((item) => item.lang.toLowerCase().startsWith("ja"))
  if (voice) utterance.voice = voice
  window.speechSynthesis.speak(utterance)
}

function KanaGrid({
  rows,
  script,
  compact = false,
}: {
  rows: { label: string; hiragana: KanaCell[]; katakana: KanaCell[] }[]
  script: "hiragana" | "katakana"
  compact?: boolean
}) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label} className="grid gap-2 rounded-xl border border-[#dfb6aa] bg-[#fffdf8]/85 p-3 md:grid-cols-[130px_1fr]">
          <div className="flex items-center">
            <Badge variant="outline" className="border-[#d89a92] text-[#8f4742]">
              {row.label}
            </Badge>
          </div>
          <div className={cn("grid gap-2", compact ? "grid-cols-5 sm:grid-cols-7 md:grid-cols-10" : "grid-cols-5")}>
            {row[script].map((cell, index) =>
              cell.kana ? (
                <button
                  key={`${cell.kana}-${index}`}
                  type="button"
                  onClick={() => speak(cell.kana)}
                  className="min-h-20 rounded-lg border border-[#ead0c6] bg-white/75 p-2 text-center transition hover:-translate-y-0.5 hover:border-[#d86f75] hover:bg-[#fff8f1]"
                >
                  <span className="block text-3xl font-bold text-[#2a211f]">{cell.kana}</span>
                  {cell.romaji && <span className="mt-1 block text-xs font-medium text-[#6f5952]">{cell.romaji}</span>}
                </button>
              ) : (
                <div key={`empty-${index}`} className="min-h-20 rounded-lg border border-dashed border-[#ead0c6]/70 bg-white/25" />
              )
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function KanaSection({ script }: { script: "hiragana" | "katakana" }) {
  const title = script === "hiragana" ? "Hiragana" : "Katakana"
  const description =
    script === "hiragana"
      ? "Dùng cho từ thuần Nhật, trợ từ và phần đọc furigana."
      : "Dùng cho từ mượn, tên nước ngoài, thuật ngữ và nhấn mạnh."

  return (
    <div className="space-y-6">
      <Card className="border-[#dfb6aa] bg-[#fffdf8]/90 shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-2xl text-[#2a211f]">{title}</CardTitle>
              <p className="mt-2 text-sm text-[#6f5952]">{description}</p>
            </div>
            <Button variant="outline" className="rounded-full border-[#dfb6aa] bg-white/70" onClick={() => speak(script === "hiragana" ? "あいうえお" : "アイウエオ")}>
              <Volume2 className="mr-2 h-4 w-4" />
              Nghe mẫu
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <KanaGrid rows={gojuonRows} script={script} />
        </CardContent>
      </Card>

      <Card className="border-[#dfb6aa] bg-[#fffdf8]/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-[#2a211f]">Âm đục và bán âm đục</CardTitle>
        </CardHeader>
        <CardContent>
          <KanaGrid rows={dakutenRows} script={script} compact />
        </CardContent>
      </Card>

      <Card className="border-[#dfb6aa] bg-[#fffdf8]/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-[#2a211f]">Âm ghép</CardTitle>
        </CardHeader>
        <CardContent>
          <KanaGrid rows={yoonRows} script={script} compact />
        </CardContent>
      </Card>
    </div>
  )
}

function KanaReactionQuiz() {
  const [mode, setMode] = useState<KanaQuizMode>("hiragana")
  const [secondsPerQuestion, setSecondsPerQuestion] = useState<5 | 10>(5)
  const [status, setStatus] = useState<"idle" | "playing" | "result">("idle")
  const [questions, setQuestions] = useState<KanaQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(5)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const transitionTimerRef = useRef<number | null>(null)

  const currentQuestion = questions[currentIndex]

  useEffect(() => {
    if (status !== "playing" || !currentQuestion || selectedAnswer !== null) return

    const countdownTimer = window.setInterval(() => {
      setTimeLeft((seconds) => Math.max(0, seconds - 1))
    }, 1000)

    return () => window.clearInterval(countdownTimer)
  }, [currentQuestion, selectedAnswer, status])

  useEffect(() => {
    if (status !== "playing" || !currentQuestion || selectedAnswer !== null || timeLeft > 0) return

    setSelectedAnswer("__timeout__")
    transitionTimerRef.current = window.setTimeout(() => {
      if (currentIndex >= questions.length - 1) {
        setStatus("result")
        return
      }

      setCurrentIndex(currentIndex + 1)
      setSelectedAnswer(null)
      setTimeLeft(secondsPerQuestion)
    }, 850)
  }, [currentIndex, currentQuestion, questions.length, secondsPerQuestion, selectedAnswer, status, timeLeft])

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current !== null) window.clearTimeout(transitionTimerRef.current)
    }
  }, [])

  function startQuiz() {
    if (transitionTimerRef.current !== null) window.clearTimeout(transitionTimerRef.current)
    setQuestions(createKanaQuestions(mode))
    setCurrentIndex(0)
    setTimeLeft(secondsPerQuestion)
    setSelectedAnswer(null)
    setScore(0)
    setStatus("playing")
  }

  function selectAnswer(answer: string) {
    if (!currentQuestion || selectedAnswer !== null) return
    setSelectedAnswer(answer)
    if (answer === currentQuestion.romaji) setScore((value) => value + 1)

    transitionTimerRef.current = window.setTimeout(() => {
      if (currentIndex >= questions.length - 1) {
        setStatus("result")
        return
      }

      setCurrentIndex(currentIndex + 1)
      setSelectedAnswer(null)
      setTimeLeft(secondsPerQuestion)
    }, 850)
  }

  if (status === "result") {
    const percentage = questions.length ? Math.round((score / questions.length) * 100) : 0
    const message = percentage >= 80 ? "Phản xạ rất tốt!" : percentage >= 60 ? "Khá ổn, luyện thêm một lượt nhé!" : "Cứ từ từ, mắt và não đang làm quen Kana."

    return (
      <Card className="overflow-hidden border-[#dfb6aa] bg-[#fffdf8]/95 shadow-sm">
        <CardContent className="flex min-h-[480px] flex-col items-center justify-center px-6 py-12 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f3c8bd]/55 text-[#8f4742]">
            <Trophy className="h-10 w-10" />
          </div>
          <Badge className="mt-6 bg-[#702f2a] text-white hover:bg-[#702f2a]">Hoàn thành 10 câu</Badge>
          <h2 className="mt-4 text-3xl font-bold text-[#2a211f]">{score}/{questions.length} câu đúng</h2>
          <p className="mt-2 text-lg font-semibold text-[#8f4742]">Độ chính xác {percentage}%</p>
          <p className="mt-3 text-[#6f5952]">{message}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button className="rounded-full bg-[#702f2a] px-6 text-white hover:bg-[#5d2723]" onClick={startQuiz}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Chơi lại
            </Button>
            <Button variant="outline" className="rounded-full border-[#dfb6aa]" onClick={() => setStatus("idle")}>
              Đổi chế độ
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (status === "playing" && currentQuestion) {
    const isTimedOut = selectedAnswer === "__timeout__"
    const progress = ((currentIndex + 1) / questions.length) * 100
    const timerProgress = (timeLeft / secondsPerQuestion) * 100
    const answerOptions = safeAnswerOptions(currentQuestion)

    return (
      <Card className="overflow-hidden border-[#dfb6aa] bg-[#fffdf8]/95 shadow-sm">
        <div className="h-1.5 bg-[#ead0c6]">
          <div className="h-full bg-[#d86f75] transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <CardContent className="px-5 py-6 sm:px-10 sm:py-8">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-medium text-[#6f5952]">
            <span>Câu {currentIndex + 1}/{questions.length}</span>
            <div className={cn("flex items-center gap-2 rounded-full px-3 py-1.5", timeLeft <= 2 ? "bg-red-100 text-red-700" : "bg-[#f3c8bd]/45 text-[#8f4742]")}>
              <Clock3 className="h-4 w-4" />
              <span>{timeLeft} giây</span>
            </div>
            <span>Điểm: {score}</span>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#ead0c6]/75">
            <div
              className={cn("h-full rounded-full transition-all duration-500", timeLeft <= 2 ? "bg-red-500" : "bg-[#315d41]")}
              style={{ width: `${timerProgress}%` }}
            />
          </div>

          <div className="my-8 text-center">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#8f4742]">Kana này đọc là gì?</p>
            <span className="mt-3 block text-8xl font-bold leading-none text-[#2a211f] sm:text-9xl">{currentQuestion.kana}</span>
          </div>

          <div className="mx-auto grid max-w-2xl grid-cols-2 gap-3">
            {answerOptions.map((option) => {
              const isCorrect = option === currentQuestion.romaji
              const isSelected = selectedAnswer === option
              const revealCorrect = selectedAnswer !== null && isCorrect

              return (
                <Button
                  key={option}
                  type="button"
                  variant="outline"
                  disabled={selectedAnswer !== null}
                  onClick={() => selectAnswer(option)}
                  className={cn(
                    "h-16 rounded-2xl border-[#dfb6aa] bg-white/80 text-lg font-bold text-[#3f302b] transition",
                    selectedAnswer === null && "hover:-translate-y-0.5 hover:border-[#d86f75] hover:bg-[#fff5ef]",
                    revealCorrect && "border-green-500 bg-green-50 text-green-700",
                    isSelected && !isCorrect && "border-red-500 bg-red-50 text-red-700"
                  )}
                >
                  {revealCorrect && <CheckCircle2 className="mr-2 h-5 w-5" />}
                  {isSelected && !isCorrect && <XCircle className="mr-2 h-5 w-5" />}
                  {option}
                </Button>
              )
            })}
          </div>

          {isTimedOut && (
            <p className="mt-5 text-center font-medium text-red-600">Hết giờ! Đáp án đúng là “{currentQuestion.romaji}”.</p>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden border-[#dfb6aa] bg-[#fffdf8]/95 shadow-sm">
      <CardHeader className="border-b border-[#ead0c6] bg-[#f9ece6]/65">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#702f2a] text-white">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-2xl text-[#2a211f]">Phản xạ Kana</CardTitle>
            <p className="mt-2 text-sm leading-6 text-[#6f5952]">Chọn cách đọc đúng trước khi đồng hồ về 0. Mỗi lượt gồm 10 câu ngẫu nhiên.</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-7 p-6 sm:p-8">
        <div>
          <p className="mb-3 text-sm font-semibold text-[#4f403b]">Bảng chữ muốn kiểm tra</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {([
              ["hiragana", "Hiragana", "あ"],
              ["katakana", "Katakana", "ア"],
              ["mixed", "Trộn cả hai", "あ・ア"],
            ] as const).map(([value, label, example]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={cn(
                  "rounded-2xl border p-4 text-left transition",
                  mode === value ? "border-[#702f2a] bg-[#fff1eb] shadow-sm" : "border-[#dfb6aa] bg-white/70 hover:bg-[#fff8f1]"
                )}
              >
                <span className="block text-2xl font-bold text-[#2a211f]">{example}</span>
                <span className="mt-1 block text-sm font-medium text-[#6f5952]">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-[#4f403b]">Thời gian mỗi câu</p>
          <div className="flex gap-3">
            {([5, 10] as const).map((seconds) => (
              <Button
                key={seconds}
                type="button"
                variant="outline"
                onClick={() => setSecondsPerQuestion(seconds)}
                className={cn("rounded-full border-[#dfb6aa]", secondsPerQuestion === seconds && "border-[#702f2a] bg-[#702f2a] text-white hover:bg-[#5d2723] hover:text-white")}
              >
                <Clock3 className="mr-2 h-4 w-4" />
                {seconds} giây
              </Button>
            ))}
          </div>
        </div>

        <Button size="lg" className="w-full rounded-full bg-[#702f2a] text-white hover:bg-[#5d2723]" onClick={startQuiz}>
          <Zap className="mr-2 h-5 w-5" />
          Bắt đầu kiểm tra
        </Button>
      </CardContent>
    </Card>
  )
}

export default function KanaPage() {
  const [activeTab, setActiveTab] = useState("hiragana")

  return (
    <div className="-m-6 min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_8%_12%,rgba(243,200,189,0.55),transparent_28%),linear-gradient(135deg,#fff8f1_0%,#fffdf8_50%,#f7d9d2_100%)] p-6">
      <div className="space-y-6">
        <section className="rounded-xl bg-[#fff8f1]/85 px-6 py-5">
          <Badge variant="outline" className="mb-3 border-[#d89a92] bg-[#f3c8bd]/45 text-[#8f4742]">
            Nền tảng chữ Nhật
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-[#2a211f]">Bảng Hiragana và Katakana</h1>
          <p className="mt-2 max-w-3xl text-base leading-7 text-[#4f403b]">
            Bấm vào từng ô để nghe phát âm. Học Hiragana trước, sau đó chuyển sang Katakana để đọc từ mượn.
          </p>
        </section>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
          <TabsList className="grid w-full max-w-xl grid-cols-3 rounded-full border border-[#dfb6aa] bg-[#f9ece6]/80 p-1">
            <TabsTrigger value="hiragana" className="rounded-full data-[state=active]:bg-[#702f2a] data-[state=active]:text-white">
              Hiragana
            </TabsTrigger>
            <TabsTrigger value="katakana" className="rounded-full data-[state=active]:bg-[#702f2a] data-[state=active]:text-white">
              Katakana
            </TabsTrigger>
            <TabsTrigger value="reaction" className="rounded-full data-[state=active]:bg-[#702f2a] data-[state=active]:text-white">
              Phản xạ Kana
            </TabsTrigger>
          </TabsList>
          <TabsContent value="hiragana">
            <KanaSection script="hiragana" />
          </TabsContent>
          <TabsContent value="katakana">
            <KanaSection script="katakana" />
          </TabsContent>
          <TabsContent value="reaction">
            <div data-i18n-managed>
              <KanaReactionQuiz />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
