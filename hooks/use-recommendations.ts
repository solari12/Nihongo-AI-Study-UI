"use client"

import { useMemo } from "react"
import { useActivityLog } from "@/hooks/use-activity-log"
import { useAdminContent } from "@/hooks/use-admin-content"
import { useStudyProgress } from "@/hooks/use-study-progress"
import { generateRecommendations } from "@/lib/recommendation/recommendation-engine"

export function useRecommendations() {
  const { content } = useAdminContent()
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
      }),
    [activities, content, progress.learnedVocabularyIds, progress.reviewVocabularyIds, stats]
  )

  return {
    activities,
    addActivity,
    clearActivities,
    recommendations,
  }
}
