import { NextResponse } from "next/server"
import { quizQuestions } from "@/lib/data/nihongo-study"

export function GET() {
  return NextResponse.json({
    items: quizQuestions,
  })
}
