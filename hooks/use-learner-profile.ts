"use client"

import { useCallback, useEffect, useState } from "react"

export type LearningGoal = "JLPT_N5" | "COMMUNICATION" | "FROM_ZERO"
export type KanaLevel = "none" | "hiragana" | "hiragana_katakana"
export type ExperienceLevel = "new" | "some" | "returning"
export type InitialLevel = "absolute_beginner" | "early_n5" | "n5_review"

export type LearnerProfile = {
  goal: LearningGoal
  kanaLevel: KanaLevel
  dailyMinutes: number
  experience: ExperienceLevel
  preferredTopics: string[]
  completedOnboarding: boolean
  createdAt: string
  updatedAt: string
}

export type PlacementResult = {
  completed: boolean
  score: number
  total: number
  percentage: number
  level: InitialLevel
  weakAreas: string[]
  recommendedStart: string
  completedAt: string
}

const profileStorageKey = "nihongo-ai-learner-profile"
const placementStorageKey = "nihongo-ai-placement-result"

export const defaultLearnerProfile: LearnerProfile = {
  goal: "FROM_ZERO",
  kanaLevel: "none",
  dailyMinutes: 20,
  experience: "new",
  preferredTopics: ["Chào hỏi", "Trường học"],
  completedOnboarding: false,
  createdAt: "",
  updatedAt: "",
}

export const defaultPlacementResult: PlacementResult = {
  completed: false,
  score: 0,
  total: 0,
  percentage: 0,
  level: "absolute_beginner",
  weakAreas: [],
  recommendedStart: "kana-basics",
  completedAt: "",
}

function readStoredValue<T>(key: string, fallback: T) {
  if (typeof window === "undefined") return fallback

  try {
    const raw = window.localStorage.getItem(key)
    return raw ? ({ ...fallback, ...JSON.parse(raw) } as T) : fallback
  } catch {
    return fallback
  }
}

function writeStoredValue<T>(key: string, value: T) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(key, JSON.stringify(value))
}

export function useLearnerProfile() {
  const [profile, setProfile] = useState<LearnerProfile>(defaultLearnerProfile)
  const [placement, setPlacement] = useState<PlacementResult>(defaultPlacementResult)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setProfile(readStoredValue(profileStorageKey, defaultLearnerProfile))
    setPlacement(readStoredValue(placementStorageKey, defaultPlacementResult))
    setIsLoaded(true)
  }, [])

  const saveProfile = useCallback((payload: Omit<LearnerProfile, "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString()
    const nextProfile: LearnerProfile = {
      ...payload,
      createdAt: profile.createdAt || now,
      updatedAt: now,
    }

    setProfile(nextProfile)
    writeStoredValue(profileStorageKey, nextProfile)
    return nextProfile
  }, [profile.createdAt])

  const savePlacementResult = useCallback((result: Omit<PlacementResult, "completed" | "completedAt">) => {
    const nextResult: PlacementResult = {
      ...result,
      completed: true,
      completedAt: new Date().toISOString(),
    }

    setPlacement(nextResult)
    writeStoredValue(placementStorageKey, nextResult)
    return nextResult
  }, [])

  const resetLearnerProfile = useCallback(() => {
    setProfile(defaultLearnerProfile)
    setPlacement(defaultPlacementResult)
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(profileStorageKey)
      window.localStorage.removeItem(placementStorageKey)
    }
  }, [])

  return {
    isLoaded,
    profile,
    placement,
    saveProfile,
    savePlacementResult,
    resetLearnerProfile,
  }
}
