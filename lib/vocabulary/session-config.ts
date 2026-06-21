import type { VocabularyItem } from "@/lib/data/nihongo-study"

export type VocabularySessionKind = "topic" | "review" | "foundation"

export type VocabularySession = {
  id: string
  title: string
  topicLabel?: string
  kind: VocabularySessionKind
  items: VocabularyItem[]
  estimatedMinutes: number
  source: "learning_path" | "direct" | "fallback"
}

const defaultLimit = 5

const topicSlugMap: Record<string, string> = {
  "Chào hỏi": "greetings",
  "Gia đình": "family",
  "Trường học": "school",
  "Thời gian": "time",
  "Số đếm": "numbers",
  "Đồ ăn": "food",
  "Ăn uống": "food",
  "Địa điểm": "places",
  "Di chuyển": "transport",
  "Đồ vật": "objects",
  "Người & nghề nghiệp": "people-jobs",
  "Cơ thể & sức khỏe": "health",
  "Màu sắc": "colors",
  "Thiên nhiên": "nature",
  "Động từ": "verbs",
  "Tính từ": "adjectives",
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function topicToSlug(topic: string) {
  return topicSlugMap[topic] ?? slugify(topic)
}

function normalizeLevel(level = "n5") {
  return level.toLowerCase()
}

export function buildVocabularySessionHref(input: {
  topic?: string
  topicSlug?: string
  kind?: VocabularySessionKind
  level?: "n5"
}) {
  const level = normalizeLevel(input.level)

  if (input.kind === "review") return `/vocabulary/session/review-${level}-today`
  if (input.kind === "foundation") return `/vocabulary/session/${level}-vocab-foundation`

  const slug = input.topicSlug ?? (input.topic ? topicToSlug(input.topic) : "")
  if (slug) return `/vocabulary/session/${slug}-${level}-001`

  return `/vocabulary/session/${level}-vocab-foundation`
}

function resolveTopicFromSessionId(sessionId: string, items: VocabularyItem[]) {
  const topicBySlug = new Map(items.map((item) => [topicToSlug(item.topic), item.topic]))
  const normalizedId = sessionId.toLowerCase()

  for (const [slug, label] of topicBySlug) {
    if (normalizedId === `${slug}-n5-001` || normalizedId.startsWith(`${slug}-`)) return label
  }

  return undefined
}

function uniqueById(items: VocabularyItem[]) {
  const seen = new Set<number>()
  return items.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

export function resolveVocabularySession(input: {
  sessionId: string
  items: VocabularyItem[]
  learnedSet: Set<number>
  reviewSet: Set<number>
  limit?: number
}): VocabularySession {
  const limit = input.limit ?? defaultLimit
  const sessionId = input.sessionId.toLowerCase()
  const foundationItems = input.items.filter((item) => !input.learnedSet.has(item.id))
  const fallbackItems = uniqueById([...foundationItems, ...input.items]).slice(0, limit)

  if (sessionId === "review-n5-today") {
    const reviewItems = input.items.filter((item) => input.reviewSet.has(item.id))
    return {
      id: input.sessionId,
      title: "Ôn từ vựng hôm nay",
      kind: "review",
      items: reviewItems.slice(0, limit),
      estimatedMinutes: 3,
      source: "learning_path",
    }
  }

  if (sessionId === "n5-vocab-foundation") {
    return {
      id: input.sessionId,
      title: "Học từ vựng nền tảng N5",
      kind: "foundation",
      items: fallbackItems,
      estimatedMinutes: 3,
      source: "learning_path",
    }
  }

  const topicLabel = resolveTopicFromSessionId(input.sessionId, input.items)
  if (topicLabel) {
    const topicItems = input.items.filter((item) => item.topic === topicLabel)
    const newTopicItems = topicItems.filter((item) => !input.learnedSet.has(item.id))
    return {
      id: input.sessionId,
      title: `Học từ mới: ${topicLabel}`,
      topicLabel,
      kind: "topic",
      items: uniqueById([...newTopicItems, ...topicItems, ...fallbackItems]).slice(0, limit),
      estimatedMinutes: 3,
      source: "learning_path",
    }
  }

  return {
    id: input.sessionId,
    title: "Không tìm thấy phiên học này",
    kind: "foundation",
    items: fallbackItems,
    estimatedMinutes: 3,
    source: "fallback",
  }
}
