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

export function useActivityLog() {
  const [activities, setActivities] = useState<LearningActivity[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setActivities(readActivities())
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    window.localStorage.setItem(storageKey, JSON.stringify(activities))
  }, [activities, isLoaded])

  const addActivity = (activity: Omit<LearningActivity, "id" | "createdAt">) => {
    setActivities((current) => [
      {
        ...activity,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      },
      ...current,
    ])
  }

  const clearActivities = () => {
    setActivities([])
  }

  return {
    activities,
    addActivity,
    clearActivities,
  }
}
