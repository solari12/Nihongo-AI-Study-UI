"use client"

import { useEffect, useMemo, useState } from "react"
import {
  grammarData,
  quizQuestions,
  vocabularyData,
  type GrammarItem,
  type QuizQuestionItem,
  type VocabularyItem,
} from "@/lib/data/nihongo-study"

export type AdminContent = {
  vocabulary: VocabularyItem[]
  grammar: GrammarItem[]
  quiz: QuizQuestionItem[]
}

const storageKey = "nihongo-ai-admin-content"

const defaultContent: AdminContent = {
  vocabulary: vocabularyData,
  grammar: grammarData,
  quiz: quizQuestions,
}

type VocabularyApiResponse = {
  items: VocabularyItem[]
}

type GrammarApiResponse = {
  items: GrammarItem[]
}

type QuizApiResponse = {
  items: QuizQuestionItem[]
}

function readContent(): AdminContent {
  if (typeof window === "undefined") return defaultContent

  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return defaultContent

    return {
      ...defaultContent,
      ...JSON.parse(raw),
    }
  } catch {
    return defaultContent
  }
}

async function fetchJson<T>(url: string, signal: AbortSignal) {
  const response = await fetch(url, { signal })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}`)
  }

  return (await response.json()) as T
}

async function fetchContent(signal: AbortSignal): Promise<AdminContent> {
  const [vocabulary, grammar, quiz] = await Promise.all([
    fetchJson<VocabularyApiResponse>("/api/vocabulary", signal),
    fetchJson<GrammarApiResponse>("/api/grammar", signal),
    fetchJson<QuizApiResponse>("/api/quiz", signal),
  ])

  return {
    vocabulary: vocabulary.items,
    grammar: grammar.items,
    quiz: quiz.items,
  }
}

function nextId<T extends { id: number }>(items: T[]) {
  return Math.max(0, ...items.map((item) => item.id)) + 1
}

export function isAdminContent(value: unknown): value is AdminContent {
  if (!value || typeof value !== "object") return false

  const content = value as Partial<AdminContent>
  return Array.isArray(content.vocabulary) && Array.isArray(content.grammar) && Array.isArray(content.quiz)
}

export function useAdminContent() {
  const [content, setContent] = useState<AdminContent>(defaultContent)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    fetchContent(controller.signal)
      .then((nextContent) => {
        setContent(nextContent)
        setError(null)
      })
      .catch((fetchError) => {
        if (controller.signal.aborted) return

        setContent(readContent())
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load content")
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
    window.localStorage.setItem(storageKey, JSON.stringify(content))
  }, [content, isLoaded])

  const topics = useMemo(() => {
    const uniqueTopics = Array.from(new Set(content.vocabulary.map((item) => item.topic)))
    return ["Tất cả", ...uniqueTopics]
  }, [content.vocabulary])

  const addVocabulary = (item: Omit<VocabularyItem, "id">) => {
    setContent((current) => ({
      ...current,
      vocabulary: [...current.vocabulary, { ...item, id: nextId(current.vocabulary) }],
    }))
  }

  const updateVocabulary = (item: VocabularyItem) => {
    setContent((current) => ({
      ...current,
      vocabulary: current.vocabulary.map((entry) => (entry.id === item.id ? item : entry)),
    }))
  }

  const deleteVocabulary = (id: number) => {
    setContent((current) => ({
      ...current,
      vocabulary: current.vocabulary.filter((item) => item.id !== id),
    }))
  }

  const addGrammar = (item: Omit<GrammarItem, "id">) => {
    setContent((current) => ({
      ...current,
      grammar: [...current.grammar, { ...item, id: nextId(current.grammar) }],
    }))
  }

  const updateGrammar = (item: GrammarItem) => {
    setContent((current) => ({
      ...current,
      grammar: current.grammar.map((entry) => (entry.id === item.id ? item : entry)),
    }))
  }

  const deleteGrammar = (id: number) => {
    setContent((current) => ({
      ...current,
      grammar: current.grammar.filter((item) => item.id !== id),
    }))
  }

  const addQuizQuestion = (item: Omit<QuizQuestionItem, "id">) => {
    setContent((current) => ({
      ...current,
      quiz: [...current.quiz, { ...item, id: nextId(current.quiz) }],
    }))
  }

  const updateQuizQuestion = (item: QuizQuestionItem) => {
    setContent((current) => ({
      ...current,
      quiz: current.quiz.map((entry) => (entry.id === item.id ? item : entry)),
    }))
  }

  const deleteQuizQuestion = (id: number) => {
    setContent((current) => ({
      ...current,
      quiz: current.quiz.filter((item) => item.id !== id),
    }))
  }

  const resetContent = () => {
    setContent(defaultContent)
  }

  const replaceContent = (nextContent: AdminContent) => {
    setContent(nextContent)
  }

  return {
    content,
    isLoaded,
    error,
    topics,
    addVocabulary,
    updateVocabulary,
    deleteVocabulary,
    addGrammar,
    updateGrammar,
    deleteGrammar,
    addQuizQuestion,
    updateQuizQuestion,
    deleteQuizQuestion,
    resetContent,
    replaceContent,
  }
}
