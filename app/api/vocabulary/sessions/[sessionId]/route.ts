import { NextResponse } from "next/server"

import { getCurrentUser } from "@/lib/auth"
import { getVocabularySessionForUser } from "@/lib/vocabulary/session-service"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

  const { sessionId } = await params
  const session = await getVocabularySessionForUser(sessionId, user.id)
  if (!session) return NextResponse.json({ error: "Vocabulary session not found" }, { status: 404 })

  return NextResponse.json({ session })
}
