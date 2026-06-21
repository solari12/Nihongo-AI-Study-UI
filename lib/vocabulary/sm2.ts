import type { VocabularyLearningStage, VocabularyRating } from "@/lib/vocabulary/types"

export type Sm2Progress = {
  repetitions: number
  intervalDays: number
  easeFactor: number
  lapses: number
}

export type Sm2Result = Sm2Progress & {
  quality: 1 | 3 | 5
  stage: VocabularyLearningStage
  dueAt: Date
}

export const vocabularyRatingQuality = {
  forgot: 1,
  hard: 3,
  remembered: 5,
} as const satisfies Record<VocabularyRating, 1 | 3 | 5>

export function calculateSm2(
  current: Sm2Progress | null,
  rating: VocabularyRating,
  reviewedAt = new Date()
): Sm2Result {
  const quality = vocabularyRatingQuality[rating]
  const previous = current ?? {
    repetitions: 0,
    intervalDays: 0,
    easeFactor: 2.5,
    lapses: 0,
  }

  let repetitions = previous.repetitions
  let intervalDays = previous.intervalDays
  let lapses = previous.lapses

  const easeFactor = Math.max(
    1.3,
    previous.easeFactor +
      0.1 -
      (5 - quality) * (0.08 + (5 - quality) * 0.02)
  )

  if (quality < 3) {
    repetitions = 0
    intervalDays = 1
    lapses += 1
  } else {
    repetitions += 1
    if (repetitions === 1) intervalDays = 1
    else if (repetitions === 2) intervalDays = 6
    else intervalDays = Math.max(1, Math.round(previous.intervalDays * easeFactor))
  }

  const stage: VocabularyLearningStage =
    repetitions >= 5 && intervalDays >= 30
      ? "mastered"
      : quality < 3
        ? "learning"
        : "review"

  return {
    quality,
    repetitions,
    intervalDays,
    easeFactor,
    lapses,
    stage,
    dueAt: new Date(reviewedAt.getTime() + intervalDays * 24 * 60 * 60 * 1000),
  }
}
