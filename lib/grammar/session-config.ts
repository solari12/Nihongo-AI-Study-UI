import type { GrammarItem } from "@/lib/data/nihongo-study"

export type GrammarSession = {
  id: string
  title: string
  items: GrammarItem[]
  estimatedMinutes: number
  source: "learning_path" | "fallback"
}

const defaultLimit = 3

export function buildGrammarSessionHref(input: {
  grammarId?: number
  kind?: "foundation"
}) {
  if (input.kind === "foundation") return "/grammar/session/grammar-n5-foundation"
  if (input.grammarId) return `/grammar/session/grammar-n5-${input.grammarId}`
  return "/grammar/session/grammar-n5-foundation"
}

function uniqueById(items: GrammarItem[]) {
  const seen = new Set<number>()
  return items.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

function isCompleted(item: GrammarItem) {
  return item.status === "Đã hoàn thành" || item.status.includes("hoàn") || item.status.includes("hoÃ")
}

export function resolveGrammarSession(input: {
  sessionId: string
  items: GrammarItem[]
  limit?: number
}): GrammarSession {
  const limit = input.limit ?? defaultLimit
  const availableItems = input.items.filter((item) => !isCompleted(item))
  const fallbackItems = uniqueById([...availableItems, ...input.items]).slice(0, limit)
  const normalizedId = input.sessionId.toLowerCase()

  if (normalizedId === "grammar-n5-foundation") {
    return {
      id: input.sessionId,
      title: "Học ngữ pháp nền tảng N5",
      items: fallbackItems,
      estimatedMinutes: 6,
      source: "learning_path",
    }
  }

  const idMatch = normalizedId.match(/^grammar-n5-(\d+)$/)
  if (idMatch) {
    const grammarId = Number(idMatch[1])
    const startIndex = input.items.findIndex((item) => item.id === grammarId)
    if (startIndex >= 0) {
      const orderedItems = uniqueById([
        input.items[startIndex],
        ...input.items.slice(startIndex + 1).filter((item) => !isCompleted(item)),
        ...fallbackItems,
      ]).slice(0, limit)

      return {
        id: input.sessionId,
        title: `Học ngữ pháp: ${input.items[startIndex].pattern}`,
        items: orderedItems,
        estimatedMinutes: 6,
        source: "learning_path",
      }
    }
  }

  return {
    id: input.sessionId,
    title: "Không tìm thấy phiên ngữ pháp này",
    items: fallbackItems,
    estimatedMinutes: 6,
    source: "fallback",
  }
}
