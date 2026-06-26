import Link from "next/link"
import { ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { requireAdminUser } from "@/lib/auth"
import learnerManagementServer from "@/lib/admin/learner-management.server"
import { LearnersPageClient } from "./learners-page-client"

export const dynamic = "force-dynamic"

export default async function AdminLearnersPage() {
  const admin = await requireAdminUser()

  if (!admin) {
    return (
      <div className="space-y-6">
        <Card className="border-amber-200 bg-amber-50/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
              Cần quyền admin
            </CardTitle>
            <CardDescription>Trang này dùng để theo dõi hồ sơ và tiến độ học tập của học viên.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link href="/dashboard">Quay lại dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const learners = await learnerManagementServer.getLearnerAdminSummariesFromDatabase()

  return <LearnersPageClient learners={learners} />
}
