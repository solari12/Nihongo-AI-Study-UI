"use client"

import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { readJsonResponse } from "@/lib/http"

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
  coldStartScore: number
  coldStartReasons: string[]
  guideCompletedSteps: string[]
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
  coldStartScore: 0,
  coldStartReasons: [],
  guideCompletedSteps: [],
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

type LearnerProfileResponse = {
  profile: LearnerProfile | null
  placement: PlacementResult | null
}

async function fetchLearnerProfile() {
  const response = await fetch("/api/learner-profile")
  return readJsonResponse<LearnerProfileResponse>(response)
}

async function saveProfileToDatabase(profile: LearnerProfile) {
  const response = await fetch("/api/learner-profile", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "profile",
      goal: profile.goal,
      kanaLevel: profile.kanaLevel,
      dailyMinutes: profile.dailyMinutes,
      experience: profile.experience,
      preferredTopics: profile.preferredTopics,
      coldStartScore: profile.coldStartScore,
      coldStartReasons: profile.coldStartReasons,
      guideCompletedSteps: profile.guideCompletedSteps,
      completedOnboarding: profile.completedOnboarding,
    }),
  })

  return readJsonResponse<{ profile: LearnerProfile }>(response)
}

async function savePlacementToDatabase(placement: PlacementResult) {
  const response = await fetch("/api/learner-profile", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "placement",
      score: placement.score,
      total: placement.total,
      percentage: placement.percentage,
      level: placement.level,
      weakAreas: placement.weakAreas,
      recommendedStart: placement.recommendedStart,
    }),
  })

  return readJsonResponse<{ placement: PlacementResult }>(response)
}

export function useLearnerProfile() {
  const { activeUser, isLoaded: isAuthLoaded } = useAuth()
  const [profile, setProfile] = useState<LearnerProfile>(defaultLearnerProfile)
  const [placement, setPlacement] = useState<PlacementResult>(defaultPlacementResult)
  const [isLoaded, setIsLoaded] = useState(false)
  const scopedProfileStorageKey = activeUser ? `${profileStorageKey}:${activeUser.id}` : profileStorageKey
  const scopedPlacementStorageKey = activeUser ? `${placementStorageKey}:${activeUser.id}` : placementStorageKey

  useEffect(() => {
    if (!isAuthLoaded) return

    const controller = new AbortController()

    fetchLearnerProfile()
      .then((data) => {
        if (controller.signal.aborted) return

        const nextProfile = data.profile ?? readStoredValue(scopedProfileStorageKey, defaultLearnerProfile)
        const nextPlacement = data.placement ?? readStoredValue(scopedPlacementStorageKey, defaultPlacementResult)
        setProfile(nextProfile)
        setPlacement(nextPlacement)
        writeStoredValue(scopedProfileStorageKey, nextProfile)
        writeStoredValue(scopedPlacementStorageKey, nextPlacement)
      })
      .catch(() => {
        if (controller.signal.aborted) return
        setProfile(readStoredValue(scopedProfileStorageKey, defaultLearnerProfile))
        setPlacement(readStoredValue(scopedPlacementStorageKey, defaultPlacementResult))
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoaded(true)
      })

    return () => {
      controller.abort()
    }
  }, [isAuthLoaded, scopedPlacementStorageKey, scopedProfileStorageKey])

  const saveProfile = useCallback((payload: Omit<LearnerProfile, "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString()
    const nextProfile: LearnerProfile = {
      ...payload,
      createdAt: profile.createdAt || now,
      updatedAt: now,
    }

    setProfile(nextProfile)
    writeStoredValue(scopedProfileStorageKey, nextProfile)
    void saveProfileToDatabase(nextProfile).then(({ profile: savedProfile }) => {
      setProfile(savedProfile)
      writeStoredValue(scopedProfileStorageKey, savedProfile)
    })
    return nextProfile
  }, [profile.createdAt, scopedProfileStorageKey])

  const savePlacementResult = useCallback((result: Omit<PlacementResult, "completed" | "completedAt">) => {
    const nextResult: PlacementResult = {
      ...result,
      completed: true,
      completedAt: new Date().toISOString(),
    }

    setPlacement(nextResult)
    writeStoredValue(scopedPlacementStorageKey, nextResult)
    void savePlacementToDatabase(nextResult).then(({ placement: savedPlacement }) => {
      setPlacement(savedPlacement)
      writeStoredValue(scopedPlacementStorageKey, savedPlacement)
    })
    return nextResult
  }, [scopedPlacementStorageKey])

  const resetLearnerProfile = useCallback(() => {
    setProfile(defaultLearnerProfile)
    setPlacement(defaultPlacementResult)
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(scopedProfileStorageKey)
      window.localStorage.removeItem(scopedPlacementStorageKey)
    }
  }, [scopedPlacementStorageKey, scopedProfileStorageKey])

  return {
    isLoaded,
    profile,
    placement,
    saveProfile,
    savePlacementResult,
    resetLearnerProfile,
  }
}
