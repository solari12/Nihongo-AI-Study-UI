"use client"

import { useEffect, useMemo, useState } from "react"
import { readJsonResponse } from "@/lib/http"
import { grammarData, quizQuestions } from "@/lib/data/nihongo-study"
import type { VocabularyProgressSummary } from "@/lib/vocabulary/types"

type QuizAttempt = {
  id: string
  date: string
  quizType: string
  score: number
  total: number
  percentage: number
}

type StudyProgress = {
  learnedVocabularyIds: number[]
  reviewVocabularyIds: number[]
  quizAttempts: QuizAttempt[]
  vocabulary: VocabularyProgressSummary
}

const storageKey = "nihongo-ai-study-progress"

const defaultProgress: StudyProgress = {
  learnedVocabularyIds: [],
  reviewVocabularyIds: [],
  quizAttempts: [],
  vocabulary: {
    total: 0,
    studied: 0,
    mastered: 0,
    dueReview: 0,
    learning: 0,
  },
}

function readProgress(): StudyProgress {
  if (typeof window === "undefined") return defaultProgress

  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return defaultProgress

    return {
      ...defaultProgress,
      ...JSON.parse(raw),
    }
  } catch {
    return defaultProgress
  }
}

async function fetchProgress() {
  const response = await fetch("/api/progress", {
    cache: "no-store",
    credentials: "include",
  })

  return readJsonResponse<StudyProgress>(response)
}

async function saveVocabularyProgress(vocabularyId: number, status: "learned" | "review") {
  const response = await fetch("/api/progress", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "vocabulary",
      vocabularyId,
      status,
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to save vocabulary progress")
  }
}

async function saveQuizAttempt(
  quizType: string,
  result: { score: number; total: number; percentage: number }
) {
  const response = await fetch("/api/progress", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "quiz_attempt",
      quizType,
      ...result,
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to save quiz attempt")
  }
}

export function useStudyProgress() {
  const [progress, setProgress] = useState<StudyProgress>(defaultProgress)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    fetchProgress()
      .then((nextProgress) => {
        if (!controller.signal.aborted) setProgress(nextProgress)
      })
      .catch(() => {
        if (!controller.signal.aborted) setProgress(readProgress())
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoaded(true)
      })

    return () => {
      controller.abort()
    }
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    window.localStorage.setItem(storageKey, JSON.stringify(progress))
  }, [isLoaded, progress])

  const learnedVocabularySet = useMemo(
    () => new Set(progress.learnedVocabularyIds),
    [progress.learnedVocabularyIds]
  )

  const reviewVocabularySet = useMemo(
    () => new Set(progress.reviewVocabularyIds),
    [progress.reviewVocabularyIds]
  )

  const stats = useMemo(() => {
    const latestAttempt = progress.quizAttempts.at(-1)
    const averageQuizScore = progress.quizAttempts.length
      ? Math.round(
          progress.quizAttempts.reduce((sum, attempt) => sum + attempt.percentage, 0) /
            progress.quizAttempts.length
        )
      : 0

    return {
      learnedVocabulary: progress.vocabulary.studied,
      totalVocabulary: progress.vocabulary.total,
      reviewVocabulary: progress.vocabulary.dueReview,
      masteredVocabulary: progress.vocabulary.mastered,
      learningVocabulary: progress.vocabulary.learning,
      completedGrammar: 0,
      totalGrammar: grammarData.length,
      quizAttempts: progress.quizAttempts.length,
      averageQuizScore,
      latestQuizScore: latestAttempt?.percentage ?? 0,
      n5Progress: Math.round(
        ((progress.vocabulary.studied / Math.max(progress.vocabulary.total, 1)) * 0.45 +
          0 +
          ((latestAttempt?.percentage ?? 0) / 100) * 0.2) *
          100
      ),
    }
  }, [progress])

  const markVocabularyLearned = (id: number) => {
    setProgress((current) => ({
      ...current,
      learnedVocabularyIds: current.learnedVocabularyIds.includes(id)
        ? current.learnedVocabularyIds
        : [...current.learnedVocabularyIds, id],
      reviewVocabularyIds: current.reviewVocabularyIds.filter((itemId) => itemId !== id),
    }))
    void saveVocabularyProgress(id, "learned")
  }

  const addVocabularyToReview = (id: number) => {
    setProgress((current) => ({
      ...current,
      reviewVocabularyIds: current.reviewVocabularyIds.includes(id)
        ? current.reviewVocabularyIds
        : [...current.reviewVocabularyIds, id],
    }))
    void saveVocabularyProgress(id, "review")
  }

  const submitQuizAttempt = (
    quizType: string,
    selectedAnswers: Record<number, string>,
    questions = quizQuestions
  ) => {
    const score = questions.reduce((total, question, index) => {
      return total + (selectedAnswers[index] === question.correctAnswer ? 1 : 0)
    }, 0)
    const percentage = Math.round((score / questions.length) * 100)

    setProgress((current) => ({
      ...current,
      quizAttempts: [
        ...current.quizAttempts,
        {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          quizType,
          score,
          total: questions.length,
          percentage,
        },
      ],
    }))

    return { score, total: questions.length, percentage }
  }

  const recordQuizAttempt = (
    quizType: string,
    result: { score: number; total: number; percentage: number }
  ) => {
    setProgress((current) => ({
      ...current,
      quizAttempts: [
        ...current.quizAttempts,
        {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          quizType,
          ...result,
        },
      ],
    }))
    void saveQuizAttempt(quizType, result)
  }

  return {
    progress,
    stats,
    isLoaded,
    learnedVocabularySet,
    reviewVocabularySet,
    markVocabularyLearned,
    addVocabularyToReview,
    submitQuizAttempt,
    recordQuizAttempt,
  }
}
