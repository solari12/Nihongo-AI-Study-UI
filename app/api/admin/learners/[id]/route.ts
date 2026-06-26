import { NextResponse } from "next/server"
import { requireAdminUser } from "@/lib/auth"
import learnerManagementServer from "@/lib/admin/learner-management.server"

export const dynamic = "force-dynamic"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminUser()
  if (!admin) return NextResponse.json({ error: "Admin access required" }, { status: 403 })

  const { id } = await params
  const learner = await learnerManagementServer.getLearnerAdminDetailFromDatabase(id)
  if (!learner) return NextResponse.json({ error: "Learner not found" }, { status: 404 })

  return NextResponse.json({ learner })
}
