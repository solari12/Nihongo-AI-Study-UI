import { notFound, redirect } from "next/navigation"

import { getCurrentUser } from "@/lib/auth"
import {
  createOrResumeVocabularySession,
  getVocabularySessionForUser,
  legacySessionInput,
} from "@/lib/vocabulary/session-service"
import { VocabularySessionClient } from "./vocabulary-session-client"

export const dynamic = "force-dynamic"

export default async function VocabularySessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const { sessionId } = await params
  const legacyInput = legacySessionInput(sessionId)
  if (legacyInput) {
    const result = await createOrResumeVocabularySession(user.id, legacyInput)
    if (!result.session) redirect("/vocabulary?empty=1")
    redirect(`/vocabulary/session/${result.session.id}`)
  }

  const session = await getVocabularySessionForUser(sessionId, user.id)
  if (!session) notFound()

  return (
    <VocabularySessionClient
      key={`${session.id}-${session.currentPosition}-${session.status}`}
      initialSession={session}
    />
  )
}
