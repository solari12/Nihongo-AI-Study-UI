import { randomUUID } from "crypto"
import { prisma } from "@/lib/prisma"

export type StoredChatRole = "user" | "assistant"

export type StoredChatMessage = {
  id: string
  conversationId: string
  role: StoredChatRole
  content: string
  provider: "openrouter" | "fallback" | null
  sources: unknown
  quizCards: unknown
  quizState: unknown
  createdAt: string
}

export type StoredChatConversation = {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messageCount: number
  lastMessage: string | null
}

type ConversationRow = {
  id: string
  title: string
  created_at: Date
  updated_at: Date
  message_count: bigint | number
  last_message: string | null
}

type MessageRow = {
  id: string
  conversation_id: string
  role: string
  content: string
  provider: string | null
  sources_json: unknown
  quiz_cards_json: unknown
  quiz_state_json: unknown
  created_at: Date
}

function safeTitle(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim()
  if (!normalized) return "Chat mới"
  return normalized.length > 42 ? `${normalized.slice(0, 42).trim()}...` : normalized
}

function mapConversation(row: ConversationRow): StoredChatConversation {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    messageCount: Number(row.message_count),
    lastMessage: row.last_message,
  }
}

function mapMessage(row: MessageRow): StoredChatMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role === "user" ? "user" : "assistant",
    content: row.content,
    provider: row.provider === "openrouter" || row.provider === "fallback" ? row.provider : null,
    sources: row.sources_json,
    quizCards: row.quiz_cards_json,
    quizState: row.quiz_state_json,
    createdAt: row.created_at.toISOString(),
  }
}

export async function listChatConversations(userId: string) {
  const rows = await prisma.$queryRaw<ConversationRow[]>`
    SELECT
      c.id,
      c.title,
      c.created_at,
      c.updated_at,
      COUNT(m.id) AS message_count,
      (
        SELECT cm.content
        FROM chat_conversation_messages cm
        WHERE cm.conversation_id = c.id
        ORDER BY cm.created_at DESC
        LIMIT 1
      ) AS last_message
    FROM chat_conversations c
    LEFT JOIN chat_conversation_messages m ON m.conversation_id = c.id
    WHERE c.user_id = ${userId}
    GROUP BY c.id
    ORDER BY c.updated_at DESC
  `

  return rows.map(mapConversation)
}

export async function getChatConversation(userId: string, conversationId: string) {
  const conversations = await prisma.$queryRaw<ConversationRow[]>`
    SELECT
      c.id,
      c.title,
      c.created_at,
      c.updated_at,
      COUNT(m.id) AS message_count,
      (
        SELECT cm.content
        FROM chat_conversation_messages cm
        WHERE cm.conversation_id = c.id
        ORDER BY cm.created_at DESC
        LIMIT 1
      ) AS last_message
    FROM chat_conversations c
    LEFT JOIN chat_conversation_messages m ON m.conversation_id = c.id
    WHERE c.user_id = ${userId} AND c.id = ${conversationId}
    GROUP BY c.id
    LIMIT 1
  `

  const conversation = conversations[0]
  if (!conversation) return null

  const messages = await prisma.$queryRaw<MessageRow[]>`
    SELECT
      id,
      conversation_id,
      role,
      content,
      provider,
      sources_json,
      quiz_cards_json,
      quiz_state_json,
      created_at
    FROM chat_conversation_messages
    WHERE user_id = ${userId} AND conversation_id = ${conversationId}
    ORDER BY created_at ASC
  `

  return {
    conversation: mapConversation(conversation),
    messages: messages.map(mapMessage),
  }
}

export async function createChatConversation(userId: string, title: string) {
  const id = randomUUID()
  const safe = safeTitle(title)

  await prisma.$executeRaw`
    INSERT INTO chat_conversations (id, user_id, title)
    VALUES (${id}, ${userId}, ${safe})
  `

  return {
    id,
    title: safe,
  }
}

export async function ensureChatConversation(userId: string, conversationId: string | null | undefined, titleSeed: string) {
  if (conversationId) {
    const existing = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM chat_conversations
      WHERE id = ${conversationId} AND user_id = ${userId}
      LIMIT 1
    `

    if (existing[0]) return existing[0].id
  }

  const created = await createChatConversation(userId, titleSeed)
  return created.id
}

export async function appendChatConversationMessage({
  conversationId,
  userId,
  role,
  content,
  provider,
  sources,
  quizCards,
  quizState,
}: {
  conversationId: string
  userId: string
  role: StoredChatRole
  content: string
  provider?: "openrouter" | "fallback" | null
  sources?: unknown
  quizCards?: unknown
  quizState?: unknown
}) {
  const id = randomUUID()

  await prisma.$executeRaw`
    INSERT INTO chat_conversation_messages (
      id,
      conversation_id,
      user_id,
      role,
      content,
      provider,
      sources_json,
      quiz_cards_json,
      quiz_state_json
    )
    VALUES (
      ${id},
      ${conversationId},
      ${userId},
      ${role},
      ${content},
      ${provider ?? null},
      ${sources ? JSON.stringify(sources) : null}::jsonb,
      ${quizCards ? JSON.stringify(quizCards) : null}::jsonb,
      ${quizState ? JSON.stringify(quizState) : null}::jsonb
    )
  `

  await prisma.$executeRaw`
    UPDATE chat_conversations
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = ${conversationId} AND user_id = ${userId}
  `

  return id
}

export async function updateChatMessageQuizState(userId: string, messageId: string, quizState: unknown) {
  await prisma.$executeRaw`
    UPDATE chat_conversation_messages
    SET quiz_state_json = ${JSON.stringify(quizState)}::jsonb
    WHERE id = ${messageId} AND user_id = ${userId} AND role = 'assistant'
  `
}

export async function deleteChatConversation(userId: string, conversationId: string) {
  await prisma.$executeRaw`
    DELETE FROM chat_conversations
    WHERE id = ${conversationId} AND user_id = ${userId}
  `
}

export async function deleteAllChatConversations(userId: string) {
  await prisma.$executeRaw`
    DELETE FROM chat_conversations
    WHERE user_id = ${userId}
  `
}
