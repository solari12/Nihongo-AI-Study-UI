"use client"

import { useEffect, useMemo, useState } from "react"
import { grammarData, quizQuestions, vocabularyData } from "@/lib/data/nihongo-study"

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
}

const storageKey = "nihongo-ai-study-progress"

const defaultProgress: StudyProgress = {
  learnedVocabularyIds: [1, 2, 5, 8],
  reviewVocabularyIds: [3, 6],
  quizAttempts: [],
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

export function useStudyProgress() {
  const [progress, setProgress] = useState<StudyProgress>(defaultProgress)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setProgress(readProgress())
    setIsLoaded(true)
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
      learnedVocabulary: progress.learnedVocabularyIds.length,
      totalVocabulary: vocabularyData.length,
      reviewVocabulary: progress.reviewVocabularyIds.length,
      completedGrammar: grammarData.filter((item) => item.status === "Đã hoàn thành").length,
      totalGrammar: grammarData.length,
      quizAttempts: progress.quizAttempts.length,
      averageQuizScore,
      latestQuizScore: latestAttempt?.percentage ?? 0,
      n5Progress: Math.round(
        ((progress.learnedVocabularyIds.length / vocabularyData.length) * 0.45 +
          (grammarData.filter((item) => item.status === "Đã hoàn thành").length / grammarData.length) *
            0.35 +
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
  }

  const addVocabularyToReview = (id: number) => {
    setProgress((current) => ({
      ...current,
      reviewVocabularyIds: current.reviewVocabularyIds.includes(id)
        ? current.reviewVocabularyIds
        : [...current.reviewVocabularyIds, id],
    }))
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
  }

  return {
    progress,
    stats,
    learnedVocabularySet,
    reviewVocabularySet,
    markVocabularyLearned,
    addVocabularyToReview,
    submitQuizAttempt,
    recordQuizAttempt,
  }
}
