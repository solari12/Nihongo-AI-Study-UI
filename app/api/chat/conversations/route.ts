import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { createChatConversation, deleteAllChatConversations, listChatConversations } from "@/lib/chat/conversations"

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

  const conversations = await listChatConversations(user.id)
  return NextResponse.json({ items: conversations })
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

  const body = (await request.json().catch(() => ({}))) as { title?: unknown }
  const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : "Chat mới"
  const conversation = await createChatConversation(user.id, title)

  return NextResponse.json({ item: conversation }, { status: 201 })
}

export async function DELETE() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

  await deleteAllChatConversations(user.id)
  return NextResponse.json({ ok: true })
}
