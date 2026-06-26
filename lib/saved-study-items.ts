export type SavedStudyItem = {
  id: string
  type: "vocabulary" | "grammar"
  sourceType: string
  sourceId: string
  itemKey: string
  title: string
  reading: string
  level: string
  meaning: string
  note: string
  example: string
  rawPayload: unknown
  createdAt: string
}

export function isUsefulSavedStudyItem(item: Pick<SavedStudyItem, "title" | "meaning" | "example">) {
  const searchable = `${item.title} ${item.meaning} ${item.example}`
  return Boolean(item.title.trim()) && !/không xuất hiện|khong xuat hien/i.test(searchable)
}
