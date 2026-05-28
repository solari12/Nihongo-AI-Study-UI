import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { toVocabularyItem } from "@/lib/mappers/study-content"

export async function GET() {
  const vocabulary = await prisma.vocabulary.findMany({
    orderBy: {
      id: "asc",
    },
  })
  const items = vocabulary.map(toVocabularyItem)
  const topics = ["Tất cả", ...Array.from(new Set(items.map((item) => item.topic)))]

  return NextResponse.json({
    topics,
    items,
  })
}
