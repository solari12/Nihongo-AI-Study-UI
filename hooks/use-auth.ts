"use client"

import { useCallback, useEffect, useState } from "react"

export type AuthRole = "learner" | "admin"

export type ClientAuthUser = {
  id: string
  name: string
  email: string
  role: AuthRole
}

type LoginPayload = {
  email: string
  password: string
}

type RegisterPayload = {
  fullName: string
  email: string
  password: string
  goal?: string
}

async function parseAuthResponse(response: Response) {
  const data = (await response.json()) as {
    user?: ClientAuthUser | null
    error?: string
  }

  if (!response.ok) {
    throw new Error(data.error || "Yêu cầu xác thực thất bại.")
  }

  return data.user ?? null
}

export function useAuth(initialUser?: ClientAuthUser | null) {
  const [user, setUser] = useState<ClientAuthUser | null>(initialUser ?? null)
  const [isLoaded, setIsLoaded] = useState(Boolean(initialUser))

  useEffect(() => {
    if (initialUser) return

    let cancelled = false

    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((data: { user?: ClientAuthUser | null }) => {
        if (!cancelled) setUser(data.user ?? null)
      })
      .finally(() => {
        if (!cancelled) setIsLoaded(true)
      })

    return () => {
      cancelled = true
    }
  }, [initialUser])

  const login = useCallback(async (payload: LoginPayload) => {
    const nextUser = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(parseAuthResponse)

    setUser(nextUser)
    return nextUser
  }, [])

  const register = useCallback(async (payload: RegisterPayload) => {
    const nextUser = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(parseAuthResponse)

    setUser(nextUser)
    return nextUser
  }, [])

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    setUser(null)
  }, [])

  return {
    isLoaded,
    user,
    activeUser: user,
    login,
    register,
    logout,
  }
}
