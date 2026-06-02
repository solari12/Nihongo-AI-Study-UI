import { GrammarPageClient } from "@/app/(app)/grammar/grammar-page-client"
import { prisma } from "@/lib/prisma"
import { toGrammarItem } from "@/lib/mappers/study-content"

export default async function GrammarPage() {
  const grammar = await prisma.grammar.findMany({
    orderBy: {
      id: "asc",
    },
  })

  return <GrammarPageClient grammarItems={grammar.map(toGrammarItem)} />
}
