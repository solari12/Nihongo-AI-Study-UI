"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { useLearnerProfile } from "@/hooks/use-learner-profile"
import { type ClientAuthUser } from "@/hooks/use-auth"

const onboardingPath = "/onboarding"
const placementPath = "/placement-test"

const gatedLearnerPaths = [
  "/dashboard",
  "/vocabulary",
  "/grammar",
  "/quiz",
  "/chatbot",
  "/learning-path",
  "/history",
]

interface OnboardingGateProps {
  children: React.ReactNode
  user: ClientAuthUser
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
          <Spinner className="h-5 w-5" />
          <span>{message}</span>
        </CardContent>
      </Card>
    </div>
  )
}

export function OnboardingGate({ children, user }: OnboardingGateProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { isLoaded, profile, placement } = useLearnerProfile()
  const isAdmin = user.role === "admin"
  const isOnboardingPath = pathname === onboardingPath
  const shouldGatePath = gatedLearnerPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))
  const needsOnboarding = !isAdmin && isLoaded && !profile.completedOnboarding && !isOnboardingPath
  const needsPlacement =
    !isAdmin &&
    isLoaded &&
    profile.completedOnboarding &&
    !placement.completed &&
    shouldGatePath

  useEffect(() => {
    if (needsOnboarding) {
      router.replace(onboardingPath)
      return
    }

    if (needsPlacement) {
      router.replace(placementPath)
    }
  }, [needsOnboarding, needsPlacement, router])

  if (isAdmin) return children

  if (!isLoaded) {
    return <LoadingState message="Đang tải hồ sơ học tập của tài khoản..." />
  }

  if (needsOnboarding) {
    return <LoadingState message="Tài khoản mới cần tạo hồ sơ học tập trước." />
  }

  if (needsPlacement) {
    return <LoadingState message="Tài khoản mới cần làm kiểm tra đầu vào trước." />
  }

  return children
}
