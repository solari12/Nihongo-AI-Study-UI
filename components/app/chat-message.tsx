"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { type ChatQuizCard, parseChatQuizCards } from "@/lib/chat/quiz"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { BookmarkPlus, CheckCircle2, Circle, FileText, HelpCircle, Newspaper, Volume2, XCircle } from "lucide-react"

type ChatSource = {
  title: string
  type: string
  href?: string
  score?: number
}

type QuizSubmitResult = {
  correctCount: number
  total: number
  percentage: number
  answeredCount: number
  wrongCount: number
  userAnswers: Record<string, string>
  submittedAt: string
  jlptLevel?: string
  quizId?: string
  articleId?: string
}

export type ChatQuizState = {
  selected: Record<string, string>
  submitted: boolean
  result?: QuizSubmitResult
}

interface ChatMessageProps {
  role: "user" | "assistant"
  content: string
  timestamp?: string
  sources?: ChatSource[]
  quizCards?: ChatQuizCard[]
  showActions?: boolean
  listenLabel?: string
  saveLabel?: string
  createQuizLabel?: string
  logActivityLabel?: string
  onSave?: () => void
  onCreateQuiz?: () => void
  onLogActivity?: () => void
  onListen?: () => void
  onQuizSubmit?: (result: QuizSubmitResult) => Promise<void>
  quizState?: ChatQuizState
  onQuizStateChange?: (state: ChatQuizState) => void
}

function sourceLabel(type: string, t: ReturnType<typeof useI18n>["t"]) {
  if (type === "grammar") return t("chatbot.source.grammar")
  if (type === "quiz") return t("chatbot.source.quiz")
  if (type === "news") return t("chatbot.source.news")
  return t("chatbot.source.vocabulary")
}

function SourceIcon({ type }: { type: string }) {
  if (type === "grammar") return <FileText className="h-3 w-3" />
  if (type === "quiz") return <HelpCircle className="h-3 w-3" />
  if (type === "news") return <Newspaper className="h-3 w-3" />
  return <BookmarkPlus className="h-3 w-3" />
}

function renderInlineMarkdown(text: string, keyPrefix: string) {
  const nodes: ReactNode[] = []
  const inlinePattern = /(\[([^\]]+)\]\(((?:\/reading|https?:\/\/reading)\?article=[^)]+)\))|(\*\*([^*]+)\*\*)/g
  let lastIndex = 0

  for (const match of text.matchAll(inlinePattern)) {
    const index = match.index ?? 0
    if (index > lastIndex) nodes.push(text.slice(lastIndex, index))

    if (match[2] && match[3]) {
      const href = match[3].replace(/^https?:\/\/reading/i, "/reading")
      nodes.push(
        <a
          key={`${keyPrefix}-link-${index}`}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-primary underline underline-offset-2"
        >
          {match[2]}
        </a>
      )
    } else if (match[5]) {
      nodes.push(
        <strong key={`${keyPrefix}-strong-${index}`} className="font-semibold text-foreground">
          {renderInlineMarkdown(match[5], `${keyPrefix}-strong-${index}`)}
        </strong>
      )
    }

    lastIndex = index + match[0].length
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex))
  return nodes
}

function renderMarkdownContent(text: string) {
  const lines = text.split(/\r?\n/)
  const blocks: ReactNode[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]
    const trimmed = line.trim()

    if (!trimmed) {
      index += 1
      continue
    }

    const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/)
    if (bulletMatch) {
      const items: string[] = []

      while (index < lines.length) {
        const itemMatch = lines[index].trim().match(/^[-*]\s+(.+)$/)
        if (!itemMatch) break
        items.push(itemMatch[1])
        index += 1
      }

      blocks.push(
        <ul key={`ul-${index}`} className="my-2 list-disc space-y-1 pl-5">
          {items.map((item, itemIndex) => (
            <li key={`${item}-${itemIndex}`}>{renderInlineMarkdown(item, `ul-${index}-${itemIndex}`)}</li>
          ))}
        </ul>
      )
      continue
    }

    const orderedMatch = trimmed.match(/^\d+\.\s+(.+)$/)
    if (orderedMatch) {
      const items: string[] = []

      while (index < lines.length) {
        const itemMatch = lines[index].trim().match(/^\d+\.\s+(.+)$/)
        if (!itemMatch) break
        items.push(itemMatch[1])
        index += 1
      }

      blocks.push(
        <ol key={`ol-${index}`} className="my-2 list-decimal space-y-1 pl-5">
          {items.map((item, itemIndex) => (
            <li key={`${item}-${itemIndex}`}>{renderInlineMarkdown(item, `ol-${index}-${itemIndex}`)}</li>
          ))}
        </ol>
      )
      continue
    }

    blocks.push(
      <p key={`p-${index}`} className="my-1">
        {renderInlineMarkdown(trimmed, `p-${index}`)}
      </p>
    )
    index += 1
  }

  return blocks
}

function QuizCards({
  cards,
  onSubmit,
  quizState,
  onStateChange,
}: {
  cards: ChatQuizCard[]
  onSubmit?: (result: QuizSubmitResult) => Promise<void>
  quizState?: ChatQuizState
  onStateChange?: (state: ChatQuizState) => void
}) {
  const { t } = useI18n()
  const [selected, setSelected] = useState<Record<string, string>>(quizState?.selected ?? {})
  const [submitted, setSubmitted] = useState(Boolean(quizState?.submitted))
  const [validationMessage, setValidationMessage] = useState("")
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "failed">("idle")

  useEffect(() => {
    setSelected(quizState?.selected ?? {})
    setSubmitted(Boolean(quizState?.submitted))
  }, [quizState?.selected, quizState?.submitted])

  if (!cards.length) return null

  const answeredCount = cards.filter((card) => selected[card.id]).length
  const correctCount = cards.filter((card) => card.answer && selected[card.id] === card.answer).length
  const hasAnswerKey = cards.every((card) => Boolean(card.answer))
  const canSubmit = hasAnswerKey && answeredCount === cards.length
  const answeredSummaryCount = submitted ? quizState?.result?.answeredCount ?? answeredCount : answeredCount
  const submittedSummary =
    saveStatus === "saved"
      ? `Bạn đã hoàn thành ${answeredSummaryCount}/${cards.length} câu. ${t("chatbot.action.savedToHistory")}.`
      : saveStatus === "failed"
        ? `Bạn đã hoàn thành ${answeredSummaryCount}/${cards.length} câu. Chưa lưu được lịch sử học.`
        : saveStatus === "saving"
          ? `Bạn đã hoàn thành ${answeredSummaryCount}/${cards.length} câu. Đang lưu lịch sử học...`
          : `Bạn đã hoàn thành ${answeredSummaryCount}/${cards.length} câu.`

  async function submitQuiz() {
    if (!hasAnswerKey) return
    if (answeredCount === 0) {
      setValidationMessage("Bạn chưa chọn đáp án nào. Hãy chọn câu trả lời trước khi nộp bài nhé.")
      return
    }
    if (!canSubmit) {
      setValidationMessage(`Bạn đã chọn ${answeredCount}/${cards.length} câu. Hãy trả lời đủ các câu trước khi nộp bài nhé.`)
      return
    }

    const percentage = Math.round((correctCount / cards.length) * 100)
    const result = {
      correctCount,
      total: cards.length,
      percentage,
      answeredCount,
      wrongCount: cards.length - correctCount,
      userAnswers: selected,
      submittedAt: new Date().toISOString(),
      quizId: cards.map((card) => card.id).join(","),
    }
    setValidationMessage("")
    setSubmitted(true)
    onStateChange?.({
      selected,
      submitted: true,
      result,
    })

    if (!onSubmit) return

    setSaveStatus("saving")
    try {
      await onSubmit(result)
      setSaveStatus("saved")
    } catch (error) {
      console.error("Failed to save chatbot quiz activity", error)
      setSaveStatus("failed")
    }
  }

  return (
    <div className="mt-3 space-y-3">
      {cards.map((card, index) => {
        const selectedAnswer = selected[card.id]
        const isCorrect = Boolean(card.answer && selectedAnswer === card.answer)

        return (
          <div key={card.id} className="rounded-lg border bg-background p-3">
            <div className="mb-2 flex items-start gap-2">
              <Badge variant="outline" className="shrink-0 rounded-full">
                Q{index + 1}
              </Badge>
              <p className="text-sm font-medium leading-6">{card.question}</p>
            </div>

            <div className="space-y-2">
              {card.options.map((option) => {
                const isSelected = selectedAnswer === option.label
                const isAnswer = card.answer === option.label
                const showCorrect = submitted && isAnswer
                const showWrong = submitted && isSelected && !isAnswer

                return (
                  <button
                    key={option.label}
                    type="button"
                    className={cn(
                      "flex w-full items-start gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors",
                      isSelected ? "border-primary bg-primary/10" : "bg-muted/30 hover:bg-muted",
                      showCorrect && "border-success bg-success/10",
                      showWrong && "border-destructive bg-destructive/10"
                    )}
                    onClick={() => {
                      if (submitted) return
                      const nextSelected = {
                        ...selected,
                        [card.id]: option.label,
                      }
                      setValidationMessage("")
                      setSelected(nextSelected)
                      onStateChange?.({
                        selected: nextSelected,
                        submitted: false,
                      })
                    }}
                    disabled={submitted}
                  >
                    {showCorrect ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    ) : showWrong ? (
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    ) : (
                      <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="font-medium">{option.label}.</span>
                    <span>{option.text}</span>
                  </button>
                )
              })}
            </div>

            {submitted && selectedAnswer && (
              <div className="mt-3 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                {card.answer ? (
                  <span className={isCorrect ? "text-success" : "text-destructive"}>
                    {isCorrect ? t("chatbot.quiz.correct") : `${t("chatbot.quiz.wrongPrefix")} ${card.answer}.`}
                  </span>
                ) : (
                  <span>{t("chatbot.quiz.selectedPrefix")} {selectedAnswer}.</span>
                )}
                {card.explanation ? <span className="ml-1">{card.explanation}</span> : null}
              </div>
            )}
          </div>
        )
      })}

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-background p-3">
        <span className="text-xs text-muted-foreground">
          {!hasAnswerKey
            ? t("chatbot.quiz.missingAnswerKey")
            : submitted
            ? submittedSummary
            : `${t("chatbot.quiz.selectedCountPrefix")} ${answeredCount}/${cards.length}.`}
        </span>
        <div className="flex items-center gap-2">
          {submitted && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                setSelected({})
                setSubmitted(false)
                setValidationMessage("")
                setSaveStatus("idle")
                onStateChange?.({
                  selected: {},
                  submitted: false,
                })
              }}
            >
              {t("chatbot.quiz.retry")}
            </Button>
          )}
          {!submitted && (
            <Button type="button" size="sm" className="h-8 text-xs" onClick={() => void submitQuiz()} disabled={!hasAnswerKey}>
              {t("chatbot.quiz.submit")}
            </Button>
          )}
        </div>
      </div>
      {validationMessage && (
        <p className="text-xs font-medium text-destructive">{validationMessage}</p>
      )}
    </div>
  )
}

export function ChatMessage({
  role,
  content,
  timestamp,
  sources,
  quizCards,
  showActions = true,
  listenLabel,
  saveLabel,
  createQuizLabel,
  logActivityLabel,
  onSave,
  onCreateQuiz,
  onLogActivity,
  onListen,
  onQuizSubmit,
  quizState,
  onQuizStateChange,
}: ChatMessageProps) {
  const { t } = useI18n()
  const isUser = role === "user"
  const parsedQuiz = useMemo(
    () => (!isUser && quizCards?.length ? parseChatQuizCards(content) : { cards: [], text: content }),
    [content, isUser, quizCards]
  )
  const cards = quizCards?.length ? quizCards : []
  const visibleContent = cards.length ? parsedQuiz.text : content
  const hasAnyAction = Boolean(onListen || onSave || onCreateQuiz || onLogActivity)

  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      <Avatar className="h-8 w-8 shrink-0">
        {isUser ? (
          <AvatarFallback className="bg-[#e96f78] text-xs font-semibold text-white shadow-sm">U</AvatarFallback>
        ) : (
          <>
            <AvatarImage src="/assets/kami-logo.png" alt="Kami" className="object-contain p-0.5" />
            <AvatarFallback className="bg-[#ffe7e4] text-[10px] font-bold text-[#d94f45]">Kami</AvatarFallback>
          </>
        )}
      </Avatar>

      <div className={cn("max-w-[84%] space-y-2", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 shadow-sm",
            isUser
              ? "rounded-tr-sm bg-[#e96f78] text-white shadow-[#e96f78]/20"
              : "rounded-tl-sm bg-muted"
          )}
        >
          {visibleContent && <div className="space-y-1 text-sm leading-7">{renderMarkdownContent(visibleContent)}</div>}
          {!isUser && (
            <QuizCards cards={cards} onSubmit={onQuizSubmit} quizState={quizState} onStateChange={onQuizStateChange} />
          )}
        </div>

        {sources && sources.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {sources.map((source, index) => {
              const content = (
                <>
                  <SourceIcon type={source.type} />
                  {sourceLabel(source.type, t)}: {source.title}
                </>
              )

              return source.href ? (
                <Badge key={`${source.title}-${index}`} variant="secondary" className="gap-1 rounded-full" asChild>
                  <a href={source.href}>{content}</a>
                </Badge>
              ) : (
                <Badge key={`${source.title}-${index}`} variant="secondary" className="gap-1 rounded-full">
                  {content}
                </Badge>
              )
            })}
          </div>
        )}

        {!isUser && showActions && hasAnyAction && (
          <div className="flex flex-wrap items-center gap-1">
            {onListen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onListen}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <Volume2 className="mr-1 h-3 w-3" />
                {listenLabel ?? t("chatbot.action.listen")}
              </Button>
            )}
            {onSave && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSave}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <BookmarkPlus className="mr-1 h-3 w-3" />
                {saveLabel ?? t("chatbot.action.saveSource")}
              </Button>
            )}
            {onCreateQuiz && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCreateQuiz}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <HelpCircle className="mr-1 h-3 w-3" />
                {createQuizLabel ?? t("chatbot.action.createQuiz")}
              </Button>
            )}
            {onLogActivity && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogActivity}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <CheckCircle2 className="mr-1 h-3 w-3" />
                {logActivityLabel ?? t("chatbot.action.logActivity")}
              </Button>
            )}
          </div>
        )}

        {timestamp && <p className="text-xs text-muted-foreground">{timestamp}</p>}
      </div>
    </div>
  )
}
