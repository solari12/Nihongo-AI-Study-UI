"use client"

import { useEffect, useState } from "react"
import { readJsonResponse } from "@/lib/http"

export type ActivityType = "vocabulary" | "vocabulary_session" | "review" | "quiz" | "grammar" | "grammar_session"

export type LearningActivity = {
  id: string
  type: ActivityType
  content: string
  topic?: string
  result?: string
  score?: number
  durationMinutes?: number
  createdAt: string
}

const storageKey = "nihongo-ai-activity-log"

function createActivityId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }

  return `activity-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function readActivities(): LearningActivity[] {
  if (typeof window === "undefined") return []

  try {
    const raw = window.localStorage.getItem(storageKey)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

async function fetchActivities() {
  const response = await fetch("/api/activity")

  const data = await readJsonResponse<{
    items: LearningActivity[]
  }>(response)
  return data.items
}

async function saveActivity(activity: Omit<LearningActivity, "id" | "createdAt">) {
  const response = await fetch("/api/activity", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(activity),
  })

  const data = await readJsonResponse<{
    item: LearningActivity
  }>(response)
  return data.item
}

async function deleteActivities() {
  const response = await fetch("/api/activity", {
    method: "DELETE",
  })

  if (!response.ok) {
    throw new Error("Failed to clear activities")
  }
}

export function useActivityLog() {
  const [activities, setActivities] = useState<LearningActivity[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    fetchActivities()
      .then((nextActivities) => {
        if (!controller.signal.aborted) setActivities(nextActivities)
      })
      .catch(() => {
        if (!controller.signal.aborted) setActivities(readActivities())
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
    window.localStorage.setItem(storageKey, JSON.stringify(activities))
  }, [activities, isLoaded])

  const addActivity = (activity: Omit<LearningActivity, "id" | "createdAt">) => {
    const optimisticActivity = {
      ...activity,
      id: createActivityId(),
      createdAt: new Date().toISOString(),
    }

    setActivities((current) => [
      optimisticActivity,
      ...current,
    ])

    void saveActivity(activity)
      .then((savedActivity) => {
        setActivities((current) =>
          current.map((entry) => (entry.id === optimisticActivity.id ? savedActivity : entry))
        )
      })
      .catch(() => {
        // Keep the optimistic local activity when the API is temporarily unavailable.
      })
  }

  const clearActivities = () => {
    setActivities([])
    void deleteActivities()
  }

  return {
    activities,
    addActivity,
    clearActivities,
  }
}
