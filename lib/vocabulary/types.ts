import type { VocabularyItem } from "@/lib/data/nihongo-study"

export type VocabularySessionKind = "new" | "review" | "topic" | "seeded"
export type VocabularySessionStatus = "active" | "completed" | "abandoned"
export type VocabularyRating = "forgot" | "hard" | "remembered"
export type VocabularyLearningStage = "learning" | "review" | "mastered"

export type VocabularyProgressSummary = {
  total: number
  studied: number
  mastered: number
  dueReview: number
  learning: number
}

export type VocabularySessionItemDto = {
  position: number
  rating: VocabularyRating | null
  answeredAt: string | null
  dueAt: string | null
  vocabulary: VocabularyItem
}

export type VocabularySessionDto = {
  id: string
  kind: VocabularySessionKind
  topicKey: string | null
  status: VocabularySessionStatus
  currentPosition: number
  totalItems: number
  createdAt: string
  updatedAt: string
  completedAt: string | null
  items: VocabularySessionItemDto[]
}

export type VocabularySessionCreateInput = {
  kind: VocabularySessionKind
  topicKey?: string
  seedVocabularyId?: number
  limit?: number
}
