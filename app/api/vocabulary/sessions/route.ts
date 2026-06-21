import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { getCurrentUser } from "@/lib/auth"
import { createOrResumeVocabularySession } from "@/lib/vocabulary/session-service"

const createSessionSchema = z.object({
  kind: z.enum(["new", "review", "topic", "seeded"]),
  topicKey: z.string().trim().min(1).optional(),
  seedVocabularyId: z.number().int().positive().optional(),
  limit: z.number().int().min(1).max(20).optional(),
}).superRefine((value, context) => {
  if (value.kind === "topic" && !value.topicKey) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["topicKey"],
      message: "topicKey is required for topic sessions",
    })
  }
  if (value.kind === "seeded" && !value.seedVocabularyId) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["seedVocabularyId"],
      message: "seedVocabularyId is required for seeded sessions",
    })
  }
})

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

  const parsed = createSessionSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid vocabulary session payload", issues: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const result = await createOrResumeVocabularySession(user.id, parsed.data)
  return NextResponse.json(result, { status: result.resumed ? 200 : 201 })
}
