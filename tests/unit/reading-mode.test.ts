import assert from "node:assert/strict"
import test from "node:test"

import { buildReadingFitReason, detectReadingSubtask, formatReadingTitleLink } from "../../lib/chat/reading-mode"

test("detects opening one concrete reading instead of recommending a list", () => {
  assert.equal(detectReadingSubtask("Mở một bài đọc N5 cụ thể"), "open_reading")
  assert.equal(detectReadingSubtask("mở 1 bài đọc N5 cho tôi"), "open_reading")
  assert.equal(detectReadingSubtask("bắt đầu một bài N5 nhẹ"), "open_reading")
})

test("detects reading recommendation list requests separately", () => {
  assert.equal(detectReadingSubtask("Có bài nào về World Cup không?"), "recommend_readings")
  assert.equal(detectReadingSubtask("gợi ý vài bài đọc N5"), "recommend_readings")
  assert.equal(detectReadingSubtask("cho tôi mấy bài dễ đọc"), "recommend_readings")
})

test("builds banana reading reason from article content, not generic category", () => {
  const reason = buildReadingFitReason({
    title: "日本人は少しかたいバナナが好き？",
    level: "N5",
    articleText: "日本人は少しかたいバナナが好きです。食べ物の習慣についての短い記事です。",
  })

  assert.match(reason, /thói quen ăn uống/)
  assert.match(reason, /từ vựng đời sống/)
  assert.doesNotMatch(reason, /Nhật ký của Tomo/)
})

test("formats open reading title as internal markdown link only when article id exists", () => {
  assert.equal(
    formatReadingTitleLink({ id: "article-123", title: "日本人は少しかたいバナナが好き？" }),
    "[日本人は少しかたいバナナが好き？](/reading?article=article-123)"
  )
  assert.equal(
    formatReadingTitleLink({ id: null, title: "日本人は少しかたいバナナが好き？" }),
    "日本人は少しかたいバナナが好き？"
  )
})
