import { NextResponse } from "next/server"
import { vocabularyData, vocabularyTopics } from "@/lib/data/nihongo-study"

export function GET() {
  return NextResponse.json({
    topics: vocabularyTopics,
    items: vocabularyData,
  })
}
