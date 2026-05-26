"use client"

import { useMemo } from "react"
import { useActivityLog } from "@/hooks/use-activity-log"
import { useAdminContent } from "@/hooks/use-admin-content"
import { useLearnerProfile } from "@/hooks/use-learner-profile"
import { useStudyProgress } from "@/hooks/use-study-progress"
import { generateRecommendations } from "@/lib/recommendation/recommendation-engine"

export function useRecommendations() {
  const { content } = useAdminContent()
  const { profile, placement } = useLearnerProfile()
  const { progress, stats } = useStudyProgress()
  const { activities, addActivity, clearActivities } = useActivityLog()

  const recommendations = useMemo(
    () =>
      generateRecommendations({
        content,
        progress: {
          learnedVocabularyIds: progress.learnedVocabularyIds,
          reviewVocabularyIds: progress.reviewVocabularyIds,
          latestQuizScore: stats.latestQuizScore,
          averageQuizScore: stats.averageQuizScore,
          quizAttempts: stats.quizAttempts,
        },
        activities,
        profile,
        placement,
      }),
    [activities, content, placement, profile, progress.learnedVocabularyIds, progress.reviewVocabularyIds, stats]
  )

  return {
    activities,
    addActivity,
    clearActivities,
    recommendations,
  }
}
