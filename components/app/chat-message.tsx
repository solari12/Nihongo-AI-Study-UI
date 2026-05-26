"use client"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { BookmarkPlus, HelpCircle, Volume2 } from "lucide-react"

interface ChatMessageProps {
  role: "user" | "assistant"
  content: string
  timestamp?: string
  sources?: {
    title: string
    type: string
  }[]
  showActions?: boolean
  onSave?: () => void
  onCreateQuiz?: () => void
  onListen?: () => void
}

export function ChatMessage({
  role,
  content,
  timestamp,
  sources,
  showActions = true,
  onSave,
  onCreateQuiz,
  onListen,
}: ChatMessageProps) {
  const isUser = role === "user"

  return (
    <div
      className={cn(
        "flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <Avatar className="h-8 w-8 shrink-0">
        {isUser ? (
          <>
            <AvatarImage src="/avatar.png" />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              T
            </AvatarFallback>
          </>
        ) : (
          <>
            <AvatarFallback className="bg-accent text-accent-foreground text-xs font-bold">
              AI
            </AvatarFallback>
          </>
        )}
      </Avatar>

      <div
        className={cn(
          "max-w-[80%] space-y-2",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-3",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-muted rounded-tl-sm"
          )}
        >
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {content}
          </div>
        </div>

        {sources && sources.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {sources.map((source, index) => (
              <span
                key={index}
                className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground"
              >
                📚 {source.title}
              </span>
            ))}
          </div>
        )}

        {!isUser && showActions && (
          <div className="flex items-center gap-1">
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
              Lưu
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
          </div>
        )}

        {timestamp && (
          <p className="text-xs text-muted-foreground">{timestamp}</p>
        )}
      </div>
    </div>
  )
}
