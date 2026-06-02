import { VocabularyPageClient } from "./vocabulary-page-client"
import { prisma } from "@/lib/prisma"
import { toVocabularyItem } from "@/lib/mappers/study-content"

const ALL_TOPIC = "Tất cả"

export const dynamic = "force-dynamic"

export default async function VocabularyPage() {
  const vocabulary = await prisma.vocabulary.findMany({
    orderBy: {
      id: "asc",
    },
  })
  const items = vocabulary.map(toVocabularyItem)
  const topics = [ALL_TOPIC, ...Array.from(new Set(items.map((item) => item.topic)))]

  return <VocabularyPageClient initialItems={items} initialTopics={topics} />
}
