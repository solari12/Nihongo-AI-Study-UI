import { AppShell } from "@/components/app/app-shell"
import { OnboardingGate } from "@/components/app/onboarding-gate"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <AppShell user={user}>
      <OnboardingGate user={user}>{children}</OnboardingGate>
    </AppShell>
  )
}
