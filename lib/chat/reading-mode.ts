export type ReadingSubtask = "open_reading" | "recommend_readings" | null

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function detectReadingSubtask(message: string): ReadingSubtask {
  const normalized = normalize(message)
  const wantsSingleReading =
    normalized.includes("mo mot bai doc") ||
    normalized.includes("mo 1 bai doc") ||
    normalized.includes("mo mot bai n") ||
    normalized.includes("mo bai n") ||
    normalized.includes("cho toi mot bai n") ||
    normalized.includes("cho minh mot bai n") ||
    normalized.includes("mot bai cu the") ||
    normalized.includes("bat dau mot bai") ||
    normalized.includes("bat dau 1 bai") ||
    (normalized.includes("mo") && normalized.includes("bai doc") && /\bn[1-5]\b/.test(normalized))
  const wantsReadingList =
    normalized.includes("goi y vai bai") ||
    normalized.includes("co bai nao") ||
    normalized.includes("danh sach bai") ||
    normalized.includes("cho toi may bai") ||
    normalized.includes("cho minh may bai") ||
    normalized.includes("vai bai doc") ||
    normalized.includes("nhieu bai")

  if (wantsSingleReading) return "open_reading"
  if (wantsReadingList) return "recommend_readings"
  return null
}

export function buildReadingFitReason(article: { title: string; level: string; articleText: string }) {
  const searchable = normalize(`${article.title} ${article.articleText}`)

  if (
    searchable.includes("banana") ||
    searchable.includes("chuoi") ||
    article.title.includes("バナナ")
  ) {
    return `Bài này phù hợp để luyện đọc ${article.level} vì chủ đề gần gũi về thói quen ăn uống, câu ngắn, dễ hiểu và có nhiều từ vựng đời sống.`
  }

  if (
    searchable.includes("robot") ||
    searchable.includes("ロボット") ||
    searchable.includes("cong nghe")
  ) {
    return `Bài này phù hợp để luyện đọc ${article.level} vì nội dung rõ, gần với đời sống/công nghệ và có nhiều từ vựng dễ dùng lại.`
  }

  if (
    searchable.includes("truong hoc") ||
    searchable.includes("hoc sinh") ||
    searchable.includes("学生") ||
    searchable.includes("学校")
  ) {
    return `Bài này phù hợp để luyện đọc ${article.level} vì chủ đề gần gũi về trường học, câu dễ theo và có nhiều từ vựng nền tảng.`
  }

  if (
    searchable.includes("thoi tiet") ||
    searchable.includes("mua") ||
    searchable.includes("nang") ||
    searchable.includes("天気")
  ) {
    return `Bài này phù hợp để luyện đọc ${article.level} vì chủ đề thời tiết quen thuộc, câu không quá dài và dễ luyện từ vựng đời sống.`
  }

  const lengthNote = article.articleText.length < 900
    ? "câu và đoạn khá ngắn"
    : "nội dung rõ, đủ để luyện đọc"

  return `Bài này phù hợp để luyện đọc ${article.level} vì ${lengthNote}, có thể dùng để luyện từ vựng và đọc hiểu từng đoạn.`
}

export function formatReadingTitleLink(article: { id?: string | null; title: string }) {
  if (!article.id) return article.title
  return `[${article.title}](/reading?article=${encodeURIComponent(article.id)})`
}
