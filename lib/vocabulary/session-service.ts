import "server-only"

import { prisma } from "@/lib/prisma"
import { toVocabularyItem } from "@/lib/mappers/study-content"
import { normalizeVocabularyTopicKey } from "@/lib/vocabulary/topics"
import type {
  VocabularySessionCreateInput,
  VocabularySessionDto,
  VocabularySessionKind,
} from "@/lib/vocabulary/types"

const DEFAULT_SESSION_LIMIT = 10
const MAX_SESSION_LIMIT = 20

type SessionWithItems = Awaited<ReturnType<typeof findSessionForUser>>

function normalizeLimit(limit?: number) {
  return Math.min(Math.max(limit ?? DEFAULT_SESSION_LIMIT, 1), MAX_SESSION_LIMIT)
}

function normalizeScope(input: VocabularySessionCreateInput) {
  return {
    kind: input.kind,
    topicKey: input.kind === "topic" ? normalizeVocabularyTopicKey(input.topicKey) : null,
    seedVocabularyId: input.kind === "seeded" ? input.seedVocabularyId ?? null : null,
  }
}

async function findSessionForUser(sessionId: string, userId: string) {
  return prisma.vocabularyStudySession.findFirst({
    where: {
      id: sessionId,
      userId,
    },
    include: {
      items: {
        orderBy: { position: "asc" },
        include: {
          vocabulary: {
            include: {
              userProgress: {
                where: { userId },
                take: 1,
              },
            },
          },
        },
      },
    },
  })
}

export function serializeVocabularySession(
  session: NonNullable<SessionWithItems>
): VocabularySessionDto {
  return {
    id: session.id,
    kind: session.kind,
    topicKey: session.topicKey,
    status: session.status,
    currentPosition: session.currentPosition,
    totalItems: session.totalItems,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    completedAt: session.completedAt?.toISOString() ?? null,
    items: session.items.map((item) => ({
      position: item.position,
      rating: item.rating,
      answeredAt: item.answeredAt?.toISOString() ?? null,
      dueAt: item.vocabulary.userProgress[0]?.dueAt.toISOString() ?? null,
      vocabulary: toVocabularyItem(item.vocabulary),
    })),
  }
}

export async function getVocabularySessionForUser(sessionId: string, userId: string) {
  const session = await findSessionForUser(sessionId, userId)
  return session ? serializeVocabularySession(session) : null
}

async function selectVocabularyIds(
  userId: string,
  input: VocabularySessionCreateInput
) {
  const limit = normalizeLimit(input.limit)
  const now = new Date()

  if (input.kind === "review") {
    const progress = await prisma.userVocabularyProgress.findMany({
      where: {
        userId,
        dueAt: { lte: now },
      },
      orderBy: [{ dueAt: "asc" }, { updatedAt: "asc" }],
      take: limit,
      select: { vocabularyId: true },
    })
    return progress.map((item) => item.vocabularyId)
  }

  if (input.kind === "topic") {
    const topicKey = normalizeVocabularyTopicKey(input.topicKey)
    const vocabulary = await prisma.vocabulary.findMany({
      where: {
        topicKey,
        userProgress: { none: { userId } },
      },
      orderBy: { id: "asc" },
      take: limit,
      select: { id: true },
    })
    return vocabulary.map((item) => item.id)
  }

  if (input.kind === "seeded") {
    if (!input.seedVocabularyId) return []
    const seed = await prisma.vocabulary.findUnique({
      where: { id: input.seedVocabularyId },
      select: { id: true, topicKey: true },
    })
    if (!seed) return []

    const related = await prisma.vocabulary.findMany({
      where: {
        id: { not: seed.id },
        topicKey: seed.topicKey,
        userProgress: { none: { userId } },
      },
      orderBy: { id: "asc" },
      take: Math.max(limit - 1, 0),
      select: { id: true },
    })
    return [seed.id, ...related.map((item) => item.id)]
  }

  const profile = await prisma.learnerProfile.findUnique({
    where: { userId },
    select: { preferredTopics: true },
  })
  const preferredTopicKeys = Array.isArray(profile?.preferredTopics)
    ? profile.preferredTopics.map((item) => normalizeVocabularyTopicKey(String(item)))
    : []

  const vocabulary = await prisma.vocabulary.findMany({
    where: {
      userProgress: { none: { userId } },
    },
    orderBy: { id: "asc" },
    select: { id: true, topicKey: true },
  })

  return vocabulary
    .sort((a, b) => {
      const aPriority = preferredTopicKeys.indexOf(normalizeVocabularyTopicKey(a.topicKey))
      const bPriority = preferredTopicKeys.indexOf(normalizeVocabularyTopicKey(b.topicKey))
      const normalizedA = aPriority === -1 ? Number.MAX_SAFE_INTEGER : aPriority
      const normalizedB = bPriority === -1 ? Number.MAX_SAFE_INTEGER : bPriority
      return normalizedA - normalizedB || a.id - b.id
    })
    .slice(0, limit)
    .map((item) => item.id)
}

export async function createOrResumeVocabularySession(
  userId: string,
  input: VocabularySessionCreateInput
) {
  const scope = normalizeScope(input)
  const existing = await prisma.vocabularyStudySession.findFirst({
    where: {
      userId,
      status: "active",
      kind: scope.kind,
      topicKey: scope.topicKey,
      seedVocabularyId: scope.seedVocabularyId,
    },
    orderBy: { updatedAt: "desc" },
    include: {
      items: {
        orderBy: { position: "asc" },
        include: {
          vocabulary: {
            include: {
              userProgress: {
                where: { userId },
                take: 1,
              },
            },
          },
        },
      },
    },
  })

  if (existing) {
    return {
      session: serializeVocabularySession(existing),
      resumed: true,
      empty: false,
    }
  }

  const vocabularyIds = await selectVocabularyIds(userId, input)
  if (!vocabularyIds.length) {
    return {
      session: null,
      resumed: false,
      empty: true,
    }
  }

  const created = await prisma.vocabularyStudySession.create({
    data: {
      userId,
      kind: scope.kind,
      topicKey: scope.topicKey,
      seedVocabularyId: scope.seedVocabularyId,
      totalItems: vocabularyIds.length,
      items: {
        create: vocabularyIds.map((vocabularyId, position) => ({
          vocabularyId,
          position,
        })),
      },
    },
    include: {
      items: {
        orderBy: { position: "asc" },
        include: {
          vocabulary: {
            include: {
              userProgress: {
                where: { userId },
                take: 1,
              },
            },
          },
        },
      },
    },
  })

  return {
    session: serializeVocabularySession(created),
    resumed: false,
    empty: false,
  }
}

export function legacySessionInput(sessionId: string): VocabularySessionCreateInput | null {
  if (sessionId === "review-n5-today") return { kind: "review", limit: 10 }
  if (sessionId === "n5-vocab-foundation") return { kind: "new", limit: 10 }

  const match = sessionId.match(/^(.+)-n5-\d+$/)
  if (!match) return null

  return {
    kind: "topic",
    topicKey: match[1].replaceAll("-", "_"),
    limit: 10,
  }
}
