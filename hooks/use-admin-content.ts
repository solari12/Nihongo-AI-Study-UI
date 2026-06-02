"use client"

import { useEffect, useMemo, useState } from "react"
import { readJsonResponse } from "@/lib/http"
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

type ItemApiResponse<T> = {
  item: T
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
  const response = await fetch(url, { signal, cache: "no-store" })

  return readJsonResponse<T>(response)
}

async function fetchContent(signal: AbortSignal): Promise<AdminContent> {
  const storedContent = readContent()
  const [vocabulary, grammar, quiz] = await Promise.allSettled([
    fetchJson<VocabularyApiResponse>("/api/vocabulary", signal),
    fetchJson<GrammarApiResponse>("/api/grammar", signal),
    fetchJson<QuizApiResponse>("/api/quiz", signal),
  ])

  const errors = [vocabulary, grammar, quiz]
    .filter((result): result is PromiseRejectedResult => result.status === "rejected")
    .map((result) => (result.reason instanceof Error ? result.reason.message : "Failed to load content"))

  if (errors.length === 3) {
    throw new Error(errors[0] ?? "Failed to load content")
  }

  return {
    vocabulary: vocabulary.status === "fulfilled" ? vocabulary.value.items : storedContent.vocabulary,
    grammar: grammar.status === "fulfilled" ? grammar.value.items : storedContent.grammar,
    quiz: quiz.status === "fulfilled" ? quiz.value.items : storedContent.quiz,
  }
}

async function mutateJson<T>(url: string, method: "POST" | "PUT" | "DELETE", body: unknown) {
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  return readJsonResponse<T>(response)
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

  const addVocabulary = async (item: Omit<VocabularyItem, "id">) => {
    const result = await mutateJson<ItemApiResponse<VocabularyItem>>("/api/vocabulary", "POST", item)
    setContent((current) => ({
      ...current,
      vocabulary: [...current.vocabulary, result.item],
    }))
    return result.item
  }

  const updateVocabulary = async (item: VocabularyItem) => {
    const result = await mutateJson<ItemApiResponse<VocabularyItem>>("/api/vocabulary", "PUT", item)
    setContent((current) => ({
      ...current,
      vocabulary: current.vocabulary.map((entry) => (entry.id === item.id ? result.item : entry)),
    }))
    return result.item
  }

  const deleteVocabulary = async (id: number) => {
    await mutateJson<{ ok: boolean }>("/api/vocabulary", "DELETE", { id })
    setContent((current) => ({
      ...current,
      vocabulary: current.vocabulary.filter((item) => item.id !== id),
    }))
  }

  const addGrammar = async (item: Omit<GrammarItem, "id">) => {
    const result = await mutateJson<ItemApiResponse<GrammarItem>>("/api/grammar", "POST", item)
    setContent((current) => ({
      ...current,
      grammar: [...current.grammar, result.item],
    }))
    return result.item
  }

  const updateGrammar = async (item: GrammarItem) => {
    const result = await mutateJson<ItemApiResponse<GrammarItem>>("/api/grammar", "PUT", item)
    setContent((current) => ({
      ...current,
      grammar: current.grammar.map((entry) => (entry.id === item.id ? result.item : entry)),
    }))
    return result.item
  }

  const deleteGrammar = async (id: number) => {
    await mutateJson<{ ok: boolean }>("/api/grammar", "DELETE", { id })
    setContent((current) => ({
      ...current,
      grammar: current.grammar.filter((item) => item.id !== id),
    }))
  }

  const addQuizQuestion = async (item: Omit<QuizQuestionItem, "id">) => {
    const result = await mutateJson<ItemApiResponse<QuizQuestionItem>>("/api/quiz", "POST", item)
    setContent((current) => ({
      ...current,
      quiz: [...current.quiz, result.item],
    }))
    return result.item
  }

  const updateQuizQuestion = async (item: QuizQuestionItem) => {
    const result = await mutateJson<ItemApiResponse<QuizQuestionItem>>("/api/quiz", "PUT", item)
    setContent((current) => ({
      ...current,
      quiz: current.quiz.map((entry) => (entry.id === item.id ? result.item : entry)),
    }))
    return result.item
  }

  const deleteQuizQuestion = async (id: number) => {
    await mutateJson<{ ok: boolean }>("/api/quiz", "DELETE", { id })
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
