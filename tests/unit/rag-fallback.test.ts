import assert from "node:assert/strict"
import test from "node:test"

import type { RagSource } from "../../lib/rag/retriever"

test("grammar fallback reads the current English chunk format", async () => {
  process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/nihongo_ai?schema=public"
  const { buildFallbackAnswer } = await import("../../lib/rag/retriever")
  const source: RagSource = {
    id: "grammar-1",
    sourceId: "1",
    type: "grammar",
    title: "N は N です",
    score: 100,
    content:
      "N は N です: N1 là N2. Structure: N1 は N2 です. Usage: Dùng để giới thiệu hoặc xác nhận danh tính. Example: 私は学生です。 - Tôi là học sinh.",
  }

  const answer = buildFallbackAnswer("Giải thích N は N です", [source])

  assert.match(answer, /Ý nghĩa: N1 là N2/)
  assert.match(answer, /Cấu trúc: N1 は N2 です/)
  assert.match(answer, /Cách dùng: Dùng để giới thiệu/)
  assert.match(answer, /Ví dụ: 私は学生です。/)
  assert.match(answer, /Dịch: Tôi là học sinh/)
  assert.doesNotMatch(answer, /Nguồn tham khảo:/)
})

test("fallback refuses an unrelated RAG source instead of answering the wrong topic", async () => {
  process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/nihongo_ai?schema=public"
  const { buildFallbackAnswer } = await import("../../lib/rag/retriever")
  const unrelatedSource: RagSource = {
    id: "grammar-no-wa",
    type: "grammar",
    title: "〜のは",
    score: 82,
    content:
      "〜のは: Việc ... thì. Structure: Verb dictionary-form + のは. Usage: Danh từ hóa hành động.",
  }

  const answer = buildFallbackAnswer(
    "niwa ni wa niwa niwatori ga iru là gì? Viết đúng bằng kanji và giải thích chỗ chơi chữ.",
    [unrelatedSource]
  )

  assert.match(answer, /nguồn đủ khớp/)
  assert.doesNotMatch(answer, /Verb dictionary-form/)
})

test("short follow-up words do not accidentally match unrelated grammar text", async () => {
  process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/nihongo_ai?schema=public"
  const { buildFallbackAnswer } = await import("../../lib/rag/retriever")
  const unrelatedSource: RagSource = {
    id: "grammar-tari",
    type: "grammar",
    title: "Verb たり Verb たりします",
    score: 80,
    content: "Liệt kê một vài hành động tiêu biểu tại N5.",
  }

  const answer = buildFallbackAnswer(
    "cho tôi thêm vài câu lẹo lưỡi vui tai nữa đi",
    [unrelatedSource]
  )

  assert.match(answer, /nguồn đủ khớp/)
  assert.doesNotMatch(answer, /Liệt kê một vài hành động/)
})
