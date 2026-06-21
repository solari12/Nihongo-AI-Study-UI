import type { LearningActivity } from "@/hooks/use-activity-log"
import type { GrammarItem } from "@/lib/data/nihongo-study"

export function getCompletedGrammarPatternsFromActivities(
  activities: LearningActivity[],
  grammarItems: GrammarItem[]
) {
  const completedGrammarActivities = activities.filter(
    (activity) => activity.type === "grammar_session" && activity.result === "completed"
  )

  return new Set(
    grammarItems
      .filter((item) =>
        completedGrammarActivities.some(
          (activity) => activity.topic === item.pattern || activity.content.includes(item.pattern)
        )
      )
      .map((item) => item.pattern)
  )
}

