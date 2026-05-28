import type { GrammarItem, QuizQuestionItem, VocabularyItem } from "@/lib/data/nihongo-study"

type DbVocabulary = {
  id: number
  japanese: string
  hiragana: string
  romaji: string
  vietnamese: string
  type: string
  topic: string
  exampleJapanese: string
  exampleVietnamese: string
}

type DbGrammar = {
  id: number
  pattern: string
  meaning: string
  structure: string
  usageNote: string
  exampleJapanese: string
  exampleVietnamese: string
  difficulty: "easy" | "medium" | "hard"
  status: "not_started" | "in_progress" | "completed"
}

type DbQuizQuestion = {
  id: number
  question: string
  type: "vocabulary" | "grammar"
  difficulty: "easy" | "medium" | "hard"
  topic: string
  correctAnswer: string
  explanation: string
  answers: {
    answerKey: string
    answerText: string
  }[]
}

export function toVocabularyItem(item: DbVocabulary): VocabularyItem {
  return {
    id: item.id,
    japanese: item.japanese,
    hiragana: item.hiragana,
    romaji: item.romaji,
    vietnamese: item.vietnamese,
    type: item.type,
    topic: item.topic,
    example: {
      japanese: item.exampleJapanese,
      vietnamese: item.exampleVietnamese,
    },
  }
}

export function toGrammarItem(item: DbGrammar): GrammarItem {
  const statusMap = {
    not_started: "Chưa học",
    in_progress: "Đang học",
    completed: "Đã hoàn thành",
  } as const

  const difficultyMap = {
    easy: "Dễ",
    medium: "Trung bình",
    hard: "Khó",
  } as const

  return {
    id: item.id,
    pattern: item.pattern,
    meaning: item.meaning,
    structure: item.structure,
    usageNote: item.usageNote,
    difficulty: difficultyMap[item.difficulty],
    status: statusMap[item.status],
    example: {
      japanese: item.exampleJapanese,
      vietnamese: item.exampleVietnamese,
    },
  }
}

export function toQuizQuestionItem(item: DbQuizQuestion): QuizQuestionItem {
  return {
    id: item.id,
    question: item.question,
    type: item.type,
    difficulty: item.difficulty,
    topic: item.topic,
    correctAnswer: item.correctAnswer,
    explanation: item.explanation,
    answers: item.answers
      .map((answer) => ({
        id: answer.answerKey,
        text: answer.answerText,
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
  }
}

export function toDbGrammarStatus(status: string) {
  if (status === "completed" || status.includes("hoÃ n") || status.includes("hoàn")) return "completed" as const
  if (status === "in_progress" || status.includes("Äang") || status.includes("Đang")) return "in_progress" as const
  return "not_started" as const
}

export function toDbDifficulty(difficulty: string) {
  if (difficulty === "hard" || difficulty.includes("Kh")) return "hard" as const
  if (difficulty === "medium" || difficulty.includes("Trung")) return "medium" as const
  return "easy" as const
}

export function buildVocabularyChunk(item: {
  japanese: string
  hiragana: string
  romaji: string
  vietnamese: string
  example: {
    japanese: string
    vietnamese: string
  }
}) {
  return `${item.japanese} (${item.hiragana}, ${item.romaji}) means ${item.vietnamese}. Example: ${item.example.japanese} - ${item.example.vietnamese}`
}

export function buildGrammarChunk(item: {
  pattern: string
  meaning: string
  structure: string
  usageNote: string
  example: {
    japanese: string
    vietnamese: string
  }
}) {
  return `${item.pattern}: ${item.meaning}. Structure: ${item.structure}. Usage: ${item.usageNote}. Example: ${item.example.japanese} - ${item.example.vietnamese}`
}

export function buildQuizChunk(item: {
  question: string
  correctAnswer: string
  explanation: string
}) {
  return `${item.question}. Correct answer: ${item.correctAnswer}. Explanation: ${item.explanation}`
}
