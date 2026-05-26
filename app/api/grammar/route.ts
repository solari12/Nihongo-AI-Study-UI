import { NextResponse } from "next/server"
import { grammarData, grammarFilters } from "@/lib/data/nihongo-study"

export function GET() {
  return NextResponse.json({
    filters: grammarFilters,
    items: grammarData,
  })
}
