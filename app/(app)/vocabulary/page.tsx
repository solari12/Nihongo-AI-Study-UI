import { VocabularyPageClient } from "./vocabulary-page-client"
import { prisma } from "@/lib/prisma"
import { toVocabularyItem } from "@/lib/mappers/study-content"
import { getCurrentUser } from "@/lib/auth"

const ALL_TOPIC = "Tất cả"

export const dynamic = "force-dynamic"

export default async function VocabularyPage() {
  const user = await getCurrentUser()
  const [vocabulary, progress, activeSession] = await Promise.all([
    prisma.vocabulary.findMany({
      orderBy: {
        id: "asc",
      },
    }),
    user
      ? prisma.userVocabularyProgress.findMany({
          where: { userId: user.id },
          select: {
            vocabularyId: true,
            stage: true,
            dueAt: true,
          },
        })
      : [],
    user
      ? prisma.vocabularyStudySession.findFirst({
          where: { userId: user.id, status: "active" },
          orderBy: { updatedAt: "desc" },
          select: { id: true, kind: true, currentPosition: true, totalItems: true },
        })
      : null,
  ])
  const items = vocabulary.map(toVocabularyItem)
  const topics = [ALL_TOPIC, ...Array.from(new Set(items.map((item) => item.topic)))]

  return (
    <VocabularyPageClient
      initialItems={items}
      initialTopics={topics}
      initialProgress={progress.map((item) => ({
        vocabularyId: item.vocabularyId,
        stage: item.stage,
        dueAt: item.dueAt.toISOString(),
      }))}
      activeSession={activeSession}
    />
  )
}
