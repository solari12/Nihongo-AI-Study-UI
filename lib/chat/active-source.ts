export type ChatSourceType = "vocabulary" | "grammar" | "quiz" | "news"

export type ActiveChatSource = {
  type: ChatSourceType
  id: string
  title: string
}

export const CHAT_ACTIVE_SOURCE_STORAGE_KEY = "nihongo_chat_active_source"
