import { NextResponse } from "next/server"
import { requireAdminUser } from "@/lib/auth"
import learnerManagementServer from "@/lib/admin/learner-management.server"

export const dynamic = "force-dynamic"

export async function GET() {
  const admin = await requireAdminUser()
  if (!admin) return NextResponse.json({ error: "Admin access required" }, { status: 403 })

  const learners = await learnerManagementServer.getLearnerAdminSummariesFromDatabase()

  return NextResponse.json({ learners })
}
