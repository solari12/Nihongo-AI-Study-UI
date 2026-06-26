import assert from "node:assert/strict"
import test from "node:test"

import type { LearningActivity } from "../../hooks/use-activity-log"
import type { AdminContent } from "../../hooks/use-admin-content"
import { generateRecommendations } from "../../lib/recommendation/recommendation-engine"

const grammarItem: AdminContent["grammar"][number] = {
  id: 1,
  pattern: "N は N です",
  meaning: "A là B",
  structure: "N1 は N2 です",
  example: {
    japanese: "私は学生です。",
    vietnamese: "Tôi là học sinh.",
  },
  usageNote: "Mẫu câu danh từ cơ bản.",
  difficulty: "Dễ",
  status: "Chưa học",
}

const content: AdminContent = {
  vocabulary: [],
  grammar: [grammarItem],
  quiz: [],
}

const progress = {
  learnedVocabularyIds: [],
  reviewVocabularyIds: [],
  latestQuizScore: 0,
  averageQuizScore: 0,
  quizAttempts: 0,
}

function completedGrammarActivity(createdAt: string): LearningActivity {
  return {
    id: "grammar-activity",
    type: "grammar_session",
    content: "Học ngữ pháp: N は N です: 3/3 mẫu đã hiểu",
    topic: "N は N です",
    result: "completed",
    score: 3,
    durationMinutes: 6,
    createdAt,
  }
}

test("does not recommend a grammar pattern completed today", () => {
  const recommendations = generateRecommendations({
    content,
    progress,
    activities: [completedGrammarActivity(new Date().toISOString())],
  })

  assert.equal(
    recommendations.some((item) => item.id === "content-next-grammar"),
    false
  )
})

test("keeps completed grammar out of the path on later days", () => {
  const recommendations = generateRecommendations({
    content,
    progress,
    activities: [completedGrammarActivity("2026-05-01T08:00:00.000Z")],
  })

  assert.equal(
    recommendations.some((item) => item.title.includes(grammarItem.pattern)),
    false
  )
})
