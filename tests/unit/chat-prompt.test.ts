import assert from "node:assert/strict"
import test from "node:test"

import {
  buildChatPrompt,
  buildKnowledgeChatPrompt,
  nihongoTutorKnowledgeSystemPrompt,
  nihongoTutorSystemPrompt,
} from "../../lib/rag/chat-prompt"
import type { RagSource } from "../../lib/rag/retriever"

test("compact knowledge prompt keeps only recent history and two bounded sources", () => {
  const sources: RagSource[] = Array.from({ length: 3 }, (_, index) => ({
    id: `source-${index}`,
    type: "grammar",
    title: `Grammar ${index}`,
    content: "x".repeat(900),
    score: 100 - index,
  }))
  const prompt = buildKnowledgeChatPrompt(
    "ý bận phải làm gì đó mà",
    sources,
    [
      { role: "user", content: "old message" },
      { role: "assistant", content: "previous answer" },
      { role: "user", content: "latest correction" },
    ]
  )

  assert.match(prompt, /old message/)
  assert.match(prompt, /previous answer/)
  assert.match(prompt, /latest correction/)
  assert.match(prompt, /Grammar 0/)
  assert.match(prompt, /Grammar 1/)
  assert.doesNotMatch(prompt, /Grammar 2/)
  assert.ok(prompt.length < 2200)
  assert.ok(nihongoTutorKnowledgeSystemPrompt.length < 1000)
})

test("knowledge prompt allows model knowledge when RAG has no relevant source", () => {
  const prompt = buildKnowledgeChatPrompt(
    "niwa ni wa niwa niwatori ga iru là gì?",
    []
  )

  assert.match(prompt, /dùng kiến thức tiếng Nhật nền/)
  assert.match(nihongoTutorKnowledgeSystemPrompt, /không từ chối chỉ vì kho dữ liệu trống/)
})

test("reference follow-up keeps the earlier numbered list in context", () => {
  const longList = [
    "1. Câu một " + "a".repeat(300),
    "2. Câu hai " + "b".repeat(300),
    "3. Câu ba " + "c".repeat(300),
    "4. Sumomo mo momo mo momo no uchi",
    "5. Câu năm",
  ].join("\n")
  const prompt = buildKnowledgeChatPrompt(
    "Không phải, ý tôi là câu thứ 4 cơ.",
    [],
    [
      { role: "user", content: "Cho tôi thêm 5 câu nói lẹo lưỡi khác." },
      { role: "assistant", content: longList },
      { role: "user", content: "Câu thứ 3 khó ở âm nào?" },
      { role: "assistant", content: "Mình đã hiểu nhầm câu thứ 3." },
    ]
  )

  assert.match(prompt, /4\. Sumomo mo momo mo momo no uchi/)
  assert.match(prompt, /Không phải, ý tôi là câu thứ 4 cơ/)
})

test("chat prompt carries explicit agent mode and hides internal data-summary instruction", () => {
  const prompt = buildChatPrompt(
    "tóm tắt bài này giúp tôi",
    [],
    [
      { role: "user", content: "Kami có phải god mode chưa?" },
      { role: "assistant", content: "Kami có thể hỗ trợ project." },
    ],
    {
      title: "チケットがほしい人が行く神社",
      level: "N5",
      category: "Đời sống",
      articleText: "日本には、チケットがほしい人が行く神社があります。",
    },
    "",
    false,
    "reading_assistant"
  )

  assert.match(prompt, /Agent mode hiện tại: reading_assistant/)
  assert.match(prompt, /Bài báo đang active:/)
  assert.match(prompt, /Không tự chuyển sang nguồn ngữ pháp\/từ vựng khác/)
  assert.match(prompt, /Do not switch to project capability\/god-mode/)
  assert.match(nihongoTutorSystemPrompt, /Không hiển thị mục "Dữ liệu đã xem"/)
  assert.doesNotMatch(nihongoTutorSystemPrompt, /có thể thêm mục "Dữ liệu đã xem"/)
})
