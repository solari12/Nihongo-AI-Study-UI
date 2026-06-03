import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { updateChatMessageQuizState } from "@/lib/chat/conversations"

type RouteContext = {
  params: Promise<{
    id: string
    messageId: string
  }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

  const { messageId } = await context.params
  const body = (await request.json().catch(() => ({}))) as { quizState?: unknown }

  await updateChatMessageQuizState(user.id, messageId, body.quizState ?? null)
  return NextResponse.json({ ok: true })
}
