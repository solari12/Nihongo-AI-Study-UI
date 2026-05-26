"use client"

import { useCallback, useEffect, useState } from "react"

export type DemoRole = "learner" | "admin"

export type DemoUser = {
  id: string
  name: string
  email: string
  role: DemoRole
  goal: string
}

const STORAGE_KEY = "nihongo-ai-demo-user"

export const demoAccounts: Record<DemoRole, DemoUser> = {
  learner: {
    id: "demo-learner",
    name: "Nguyễn Văn Tuấn",
    email: "learner@nihongo.local",
    role: "learner",
    goal: "Thi JLPT N5",
  },
  admin: {
    id: "demo-admin",
    name: "Solari Admin",
    email: "admin@nihongo.local",
    role: "admin",
    goal: "Quản lý dữ liệu N5",
  },
}

function readStoredUser() {
  if (typeof window === "undefined") return null

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as DemoUser) : null
  } catch {
    return null
  }
}

function persistUser(user: DemoUser | null) {
  if (typeof window === "undefined") return

  if (user) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  } else {
    window.localStorage.removeItem(STORAGE_KEY)
  }
}

export function useDemoAuth() {
  const [user, setUser] = useState<DemoUser | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setUser(readStoredUser())
    setIsLoaded(true)
  }, [])

  const loginAs = useCallback((role: DemoRole, overrides?: Partial<DemoUser>) => {
    const nextUser = {
      ...demoAccounts[role],
      ...overrides,
      role,
    }
    setUser(nextUser)
    persistUser(nextUser)
    return nextUser
  }, [])

  const registerLearner = useCallback((payload: Pick<DemoUser, "name" | "email" | "goal">) => {
    const nextUser: DemoUser = {
      ...demoAccounts.learner,
      id: `demo-learner-${Date.now()}`,
      ...payload,
      role: "learner",
    }
    setUser(nextUser)
    persistUser(nextUser)
    return nextUser
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    persistUser(null)
  }, [])

  return {
    isLoaded,
    user,
    activeUser: user ?? demoAccounts.learner,
    loginAs,
    registerLearner,
    logout,
  }
}
