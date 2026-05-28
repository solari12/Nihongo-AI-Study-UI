"use client"

import { useEffect, useState } from "react"

export type ActivityType = "vocabulary" | "review" | "quiz" | "grammar"

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

  if (!response.ok) {
    throw new Error("Failed to fetch activities")
  }

  const data = (await response.json()) as {
    items: LearningActivity[]
  }
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

  if (!response.ok) {
    throw new Error("Failed to save activity")
  }

  const data = (await response.json()) as {
    item: LearningActivity
  }
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
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }

    setActivities((current) => [
      optimisticActivity,
      ...current,
    ])

    void saveActivity(activity).then((savedActivity) => {
      setActivities((current) =>
        current.map((entry) => (entry.id === optimisticActivity.id ? savedActivity : entry))
      )
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
