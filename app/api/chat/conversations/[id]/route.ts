import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { deleteChatConversation, getChatConversation } from "@/lib/chat/conversations"

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

  const { id } = await context.params
  const item = await getChatConversation(user.id, id)
  if (!item) return NextResponse.json({ error: "Conversation not found" }, { status: 404 })

  return NextResponse.json(item)
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

  const { id } = await context.params
  await deleteChatConversation(user.id, id)

  return NextResponse.json({ ok: true })
}
