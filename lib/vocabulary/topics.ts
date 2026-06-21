export const vocabularyTopicLabels = {
  greetings: "Chào hỏi",
  family: "Gia đình",
  school: "Trường học",
  time: "Thời gian",
  numbers: "Số đếm",
  food: "Đồ ăn",
  places: "Địa điểm",
  transport: "Di chuyển",
  objects: "Đồ vật",
  people_jobs: "Người & nghề nghiệp",
  health: "Cơ thể & sức khỏe",
  colors: "Màu sắc",
  nature: "Thiên nhiên",
  verbs: "Động từ",
  adjectives: "Tính từ",
  other: "Khác",
} as const

export type VocabularyTopicKey = keyof typeof vocabularyTopicLabels

const labelToKey = new Map<string, VocabularyTopicKey>(
  Object.entries(vocabularyTopicLabels).map(([key, label]) => [label, key as VocabularyTopicKey])
)

export function normalizeVocabularyTopicKey(value?: string | null): VocabularyTopicKey {
  if (!value) return "other"
  if (value in vocabularyTopicLabels) return value as VocabularyTopicKey
  return labelToKey.get(value) ?? "other"
}

export function vocabularyTopicLabel(value?: string | null) {
  return vocabularyTopicLabels[normalizeVocabularyTopicKey(value)]
}

export function topicKeyToSessionSlug(topicKey: string) {
  return topicKey.replaceAll("_", "-")
}

export function sessionSlugToTopicKey(slug: string) {
  return normalizeVocabularyTopicKey(slug.replaceAll("-", "_"))
}
