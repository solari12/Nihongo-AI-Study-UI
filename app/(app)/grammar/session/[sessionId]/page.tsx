import { GrammarSessionClient } from "./grammar-session-client"
import { prisma } from "@/lib/prisma"
import { toGrammarItem } from "@/lib/mappers/study-content"

export const dynamic = "force-dynamic"

export default async function GrammarSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const grammar = await prisma.grammar.findMany({
    orderBy: {
      id: "asc",
    },
  })

  return <GrammarSessionClient sessionId={sessionId} grammarItems={grammar.map(toGrammarItem)} />
}
