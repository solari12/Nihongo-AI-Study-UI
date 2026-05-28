import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUser } from "@/lib/auth"
import { readJsonRequest } from "@/lib/auth-validation"
import { prisma } from "@/lib/prisma"

const stringArraySchema = z.array(z.string().trim().min(1))

const profileSchema = z.object({
  type: z.literal("profile"),
  goal: z.enum(["JLPT_N5", "COMMUNICATION", "FROM_ZERO"]),
  kanaLevel: z.enum(["none", "hiragana", "hiragana_katakana"]),
  dailyMinutes: z.number().int().min(5).max(180),
  experience: z.enum(["new", "some", "returning"]),
  preferredTopics: stringArraySchema,
  coldStartScore: z.number().int().min(0).max(100),
  coldStartReasons: stringArraySchema,
  guideCompletedSteps: stringArraySchema,
  completedOnboarding: z.boolean(),
})

const placementSchema = z.object({
  type: z.literal("placement"),
  score: z.number().int().min(0),
  total: z.number().int().positive(),
  percentage: z.number().int().min(0).max(100),
  level: z.enum(["absolute_beginner", "early_n5", "n5_review"]),
  weakAreas: stringArraySchema,
  recommendedStart: z.string().trim().min(1),
})

const mutationSchema = z.discriminatedUnion("type", [profileSchema, placementSchema])

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

  const [profile, placement] = await Promise.all([
    prisma.learnerProfile.findUnique({
      where: { userId: user.id },
    }),
    prisma.placementResult.findUnique({
      where: { userId: user.id },
    }),
  ])

  return NextResponse.json({
    profile: profile
      ? {
          goal: profile.goal,
          kanaLevel: profile.kanaLevel,
          dailyMinutes: profile.dailyMinutes,
          experience: profile.experience,
          preferredTopics: asStringArray(profile.preferredTopics),
          coldStartScore: profile.coldStartScore,
          coldStartReasons: asStringArray(profile.coldStartReasons),
          guideCompletedSteps: asStringArray(profile.guideCompletedSteps),
          completedOnboarding: profile.completedOnboarding,
          createdAt: profile.createdAt.toISOString(),
          updatedAt: profile.updatedAt.toISOString(),
        }
      : null,
    placement: placement
      ? {
          completed: true,
          score: placement.score,
          total: placement.total,
          percentage: placement.percentage,
          level: placement.level,
          weakAreas: asStringArray(placement.weakAreas),
          recommendedStart: placement.recommendedStart,
          completedAt: placement.completedAt.toISOString(),
        }
      : null,
  })
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

  const parsed = mutationSchema.safeParse(await readJsonRequest(request))
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid learner profile payload" }, { status: 400 })
  }

  if (parsed.data.type === "profile") {
    const profile = await prisma.learnerProfile.upsert({
      where: { userId: user.id },
      update: {
        goal: parsed.data.goal,
        kanaLevel: parsed.data.kanaLevel,
        dailyMinutes: parsed.data.dailyMinutes,
        experience: parsed.data.experience,
        preferredTopics: parsed.data.preferredTopics,
        coldStartScore: parsed.data.coldStartScore,
        coldStartReasons: parsed.data.coldStartReasons,
        guideCompletedSteps: parsed.data.guideCompletedSteps,
        completedOnboarding: parsed.data.completedOnboarding,
      },
      create: {
        userId: user.id,
        goal: parsed.data.goal,
        kanaLevel: parsed.data.kanaLevel,
        dailyMinutes: parsed.data.dailyMinutes,
        experience: parsed.data.experience,
        preferredTopics: parsed.data.preferredTopics,
        coldStartScore: parsed.data.coldStartScore,
        coldStartReasons: parsed.data.coldStartReasons,
        guideCompletedSteps: parsed.data.guideCompletedSteps,
        completedOnboarding: parsed.data.completedOnboarding,
      },
    })

    return NextResponse.json({
      profile: {
        goal: profile.goal,
        kanaLevel: profile.kanaLevel,
        dailyMinutes: profile.dailyMinutes,
        experience: profile.experience,
        preferredTopics: asStringArray(profile.preferredTopics),
        coldStartScore: profile.coldStartScore,
        coldStartReasons: asStringArray(profile.coldStartReasons),
        guideCompletedSteps: asStringArray(profile.guideCompletedSteps),
        completedOnboarding: profile.completedOnboarding,
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString(),
      },
    })
  }

  const placement = await prisma.placementResult.upsert({
    where: { userId: user.id },
    update: {
      score: parsed.data.score,
      total: parsed.data.total,
      percentage: parsed.data.percentage,
      level: parsed.data.level,
      weakAreas: parsed.data.weakAreas,
      recommendedStart: parsed.data.recommendedStart,
      completedAt: new Date(),
    },
    create: {
      userId: user.id,
      score: parsed.data.score,
      total: parsed.data.total,
      percentage: parsed.data.percentage,
      level: parsed.data.level,
      weakAreas: parsed.data.weakAreas,
      recommendedStart: parsed.data.recommendedStart,
      completedAt: new Date(),
    },
  })

  return NextResponse.json({
    placement: {
      completed: true,
      score: placement.score,
      total: placement.total,
      percentage: placement.percentage,
      level: placement.level,
      weakAreas: asStringArray(placement.weakAreas),
      recommendedStart: placement.recommendedStart,
      completedAt: placement.completedAt.toISOString(),
    },
  })
}
