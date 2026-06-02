"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookmarkPlus, CheckCircle2, FileText, HelpCircle, Newspaper, Volume2 } from "lucide-react"
import { cn } from "@/lib/utils"

type ChatSource = {
  title: string
  type: string
  score?: number
}

interface ChatMessageProps {
  role: "user" | "assistant"
  content: string
  timestamp?: string
  sources?: ChatSource[]
  showActions?: boolean
  onSave?: () => void
  onCreateQuiz?: () => void
  onLogActivity?: () => void
  onListen?: () => void
}

function sourceLabel(type: string) {
  if (type === "grammar") return "Ngữ pháp"
  if (type === "quiz") return "Quiz"
  if (type === "news") return "Bài đọc"
  return "Từ vựng"
}

function SourceIcon({ type }: { type: string }) {
  if (type === "grammar") return <FileText className="h-3 w-3" />
  if (type === "quiz") return <HelpCircle className="h-3 w-3" />
  if (type === "news") return <Newspaper className="h-3 w-3" />
  return <BookmarkPlus className="h-3 w-3" />
}

export function ChatMessage({
  role,
  content,
  timestamp,
  sources,
  showActions = true,
  onSave,
  onCreateQuiz,
  onLogActivity,
  onListen,
}: ChatMessageProps) {
  const isUser = role === "user"

  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      <Avatar className="h-8 w-8 shrink-0">
        {isUser ? (
          <>
            <AvatarImage src="/avatar.png" alt="" />
            <AvatarFallback className="bg-primary text-xs text-primary-foreground">U</AvatarFallback>
          </>
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
          <div className="whitespace-pre-wrap text-sm leading-7">{content}</div>
        </div>

        {sources && sources.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {sources.map((source, index) => (
              <Badge key={`${source.title}-${index}`} variant="secondary" className="gap-1 rounded-full">
                <SourceIcon type={source.type} />
                {sourceLabel(source.type)}: {source.title}
              </Badge>
            ))}
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
              Nghe
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onSave}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <BookmarkPlus className="mr-1 h-3 w-3" />
              Lưu nguồn
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCreateQuiz}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <HelpCircle className="mr-1 h-3 w-3" />
              Tạo quiz
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogActivity}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Ghi hoạt động
            </Button>
          </div>
        )}

        {timestamp && <p className="text-xs text-muted-foreground">{timestamp}</p>}
      </div>
    </div>
  )
}
