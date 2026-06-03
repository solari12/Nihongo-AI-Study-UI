"use client"

import { useMemo, useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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

function renderInternalMarkdownLinks(text: string) {
  const nodes: React.ReactNode[] = []
  const linkPattern = /\[([^\]]+)\]\(((?:\/reading|https?:\/\/reading)\?article=[^)]+)\)/g
  let lastIndex = 0

  for (const match of text.matchAll(linkPattern)) {
    const index = match.index ?? 0
    if (index > lastIndex) nodes.push(text.slice(lastIndex, index))
    const href = match[2].replace(/^https?:\/\/reading/i, "/reading")

    nodes.push(
      <a
        key={`${href}-${index}`}
        href={href}
        target="_blank"
        rel="noreferrer"
        className="font-medium text-primary underline underline-offset-2"
      >
        {match[1]}
      </a>
    )
    lastIndex = index + match[0].length
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex))
  return nodes
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
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "failed">("idle")

  if (!cards.length) return null

  const answeredCount = cards.filter((card) => selected[card.id]).length
  const correctCount = cards.filter((card) => card.answer && selected[card.id] === card.answer).length
  const canSubmit = answeredCount === cards.length

  async function submitQuiz() {
    if (!canSubmit) return

    const percentage = Math.round((correctCount / cards.length) * 100)
    const result = {
      correctCount,
      total: cards.length,
      percentage,
    }
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
          {submitted
            ? `${t("chatbot.quiz.resultPrefix")} ${correctCount}/${cards.length} ${t("chatbot.correctUnit")}.`
            : `${t("chatbot.quiz.selectedCountPrefix")} ${answeredCount}/${cards.length}.`}
          {saveStatus === "saving" ? ` ${t("chatbot.quiz.saving")}` : null}
          {saveStatus === "saved" ? ` ${t("chatbot.quiz.saved")}` : null}
          {saveStatus === "failed" ? ` ${t("chatbot.quiz.failed")}` : null}
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
            <Button type="button" size="sm" className="h-8 text-xs" onClick={() => void submitQuiz()} disabled={!canSubmit}>
              {t("chatbot.quiz.submit")}
            </Button>
          )}
        </div>
      </div>
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

  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      <Avatar className="h-8 w-8 shrink-0">
        {isUser ? (
          <AvatarFallback className="bg-primary text-xs text-primary-foreground">U</AvatarFallback>
        ) : (
          <AvatarFallback className="bg-accent text-xs font-bold text-accent-foreground">AI</AvatarFallback>
        )}
      </Avatar>

      <div className={cn("max-w-[84%] space-y-2", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 shadow-sm",
            isUser ? "rounded-tr-sm bg-primary text-primary-foreground" : "rounded-tl-sm bg-muted"
          )}
        >
          {visibleContent && <div className="whitespace-pre-wrap text-sm leading-7">{renderInternalMarkdownLinks(visibleContent)}</div>}
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

        {!isUser && showActions && (
          <div className="flex flex-wrap items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onListen}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <Volume2 className="mr-1 h-3 w-3" />
              {t("chatbot.action.listen")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onSave}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <BookmarkPlus className="mr-1 h-3 w-3" />
              {t("chatbot.action.saveSource")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCreateQuiz}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <HelpCircle className="mr-1 h-3 w-3" />
              {t("chatbot.action.createQuiz")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogActivity}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <CheckCircle2 className="mr-1 h-3 w-3" />
              {t("chatbot.action.logActivity")}
            </Button>
          </div>
        )}

        {timestamp && <p className="text-xs text-muted-foreground">{timestamp}</p>}
      </div>
    </div>
  )
}
