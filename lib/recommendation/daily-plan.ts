import type { LearningActivity } from "@/hooks/use-activity-log"
import type { Recommendation } from "@/lib/recommendation/recommendation-engine"

function isSameDay(firstDate: string, secondDate = new Date()) {
  const first = new Date(firstDate)

  return (
    first.getFullYear() === secondDate.getFullYear() &&
    first.getMonth() === secondDate.getMonth() &&
    first.getDate() === secondDate.getDate()
  )
}

function isCompletedStudyActivity(activity: LearningActivity) {
  return (
    activity.result === "completed" &&
    isSameDay(activity.createdAt) &&
    ["vocabulary_session", "grammar_session", "quiz", "review"].includes(activity.type)
  )
}

export function getRecommendationMinutes(recommendation: Recommendation) {
  const match = recommendation.estimatedTime.match(/\d+/)
  return match ? Number(match[0]) : 10
}

export function buildDailyPlan({
  recommendations,
  activities,
  dailyMinutes,
  maxItems = 4,
}: {
  recommendations: Recommendation[]
  activities: LearningActivity[]
  dailyMinutes: number
  maxItems?: number
}) {
  const completedActivities = activities.filter(isCompletedStudyActivity)
  const completedMinutes = completedActivities.reduce(
    (total, activity) => total + (activity.durationMinutes ?? 0),
    0
  )
  const targetMinutes = Math.max(5, dailyMinutes || 30)
  const remainingMinutes = Math.max(0, targetMinutes - completedMinutes)
  const items: Recommendation[] = []
  let plannedMinutes = 0

  for (const recommendation of recommendations) {
    if (items.length >= maxItems) break

    const minutes = getRecommendationMinutes(recommendation)
    const fitsRemainingTime = plannedMinutes + minutes <= remainingMinutes
    const isFirstTaskOfDay = completedActivities.length === 0 && items.length === 0

    if (fitsRemainingTime || isFirstTaskOfDay) {
      items.push(recommendation)
      plannedMinutes += minutes
    }
  }

  return {
    items,
    completedActivities,
    completedMinutes,
    plannedMinutes,
    remainingMinutes,
    targetMinutes,
    isGoalComplete:
      completedActivities.length > 0 &&
      (completedMinutes >= targetMinutes || items.length === 0),
  }
}
