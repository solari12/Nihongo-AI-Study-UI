import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { toGrammarItem } from "@/lib/mappers/study-content"

export async function GET() {
  const grammar = await prisma.grammar.findMany({
    orderBy: {
      id: "asc",
    },
  })

  return NextResponse.json({
    filters: ["Tất cả", "Chưa học", "Đang học", "Đã hoàn thành"],
    items: grammar.map(toGrammarItem),
  })
}
