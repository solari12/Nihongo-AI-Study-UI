"use client"

import { type ClientAuthUser } from "@/hooks/use-auth"
import { useLearnerProfile } from "@/hooks/use-learner-profile"
import { Spinner } from "@/components/ui/spinner"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"

interface OnboardingGateProps {
  children: React.ReactNode
  user: ClientAuthUser
}

export function OnboardingGate({ children, user }: OnboardingGateProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { isLoaded, profile, placement } = useLearnerProfile()
  const isAdmin = user.role === "admin"

  const isSetupRoute = pathname === "/dashboard" || pathname === "/onboarding" || pathname === "/placement-test"

  useEffect(() => {
    if (isAdmin || !isLoaded || isSetupRoute) return

    if (!profile.completedOnboarding) {
      router.replace("/onboarding")
      return
    }

    if (!placement.completed) {
      router.replace("/placement-test")
    }
  }, [isAdmin, isLoaded, isSetupRoute, placement.completed, profile.completedOnboarding, router])

  if (isAdmin) return children

  if (!isLoaded) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
          <Spinner className="h-4 w-4" />
          <span>Đang kiểm tra lộ trình học...</span>
        </div>
      </div>
    )
  }

  if (!isSetupRoute && (!profile.completedOnboarding || !placement.completed)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
          <Spinner className="h-4 w-4" />
          <span>Đang chuyển đến bước thiết lập...</span>
        </div>
      </div>
    )
  }

  return children
}
