"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { type ClientAuthUser } from "@/hooks/use-auth"
import { useLearnerProfile } from "@/hooks/use-learner-profile"

interface OnboardingGateProps {
  children: React.ReactNode
  user: ClientAuthUser
}

export function OnboardingGate({ children, user }: OnboardingGateProps) {
  const pathname = usePathname()
  const { isLoaded, profile, placement } = useLearnerProfile()
  const [isDismissed, setIsDismissed] = useState(false)
  const isAdmin = user.role === "admin"
  const isSetupRoute = pathname === "/dashboard" || pathname === "/onboarding" || pathname === "/placement-test"
  const shouldShowSetupPrompt =
    !isAdmin && isLoaded && !isSetupRoute && !isDismissed && (!profile.completedOnboarding || !placement.completed)

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

  return (
    <>
      {shouldShowSetupPrompt && (
        <Card className="mb-5 border-[#dfb6aa] bg-[#fff8f1] shadow-sm">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">Hoàn tất hồ sơ để gợi ý học chính xác hơn</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Bạn vẫn có thể xem các trang khác. Cold-start chỉ giúp app biết mục tiêu, trình độ và bài nên ưu tiên.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button asChild size="sm">
                <Link href={profile.completedOnboarding ? "/placement-test" : "/onboarding"}>
                  {profile.completedOnboarding ? "Làm placement" : "Tạo hồ sơ"}
                </Link>
              </Button>
              <Button variant="ghost" size="icon" aria-label="Ẩn nhắc thiết lập" onClick={() => setIsDismissed(true)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {children}
    </>
  )
}
