import assert from "node:assert/strict"
import test from "node:test"

import type { LearningActivity } from "../../hooks/use-activity-log"
import { buildDailyPlan } from "../../lib/recommendation/daily-plan"
import type { Recommendation } from "../../lib/recommendation/recommendation-engine"

function recommendation(id: string, minutes: number): Recommendation {
  return {
    id,
    type: "vocabulary",
    title: id,
    reason: "reason",
    action: "action",
    expectedOutcome: "outcome",
    priority: 50,
    riskScore: 50,
    masteryScore: 50,
    learningState: "on-track",
    estimatedTime: `${minutes} phút`,
    targetUrl: "/vocabulary",
    evidence: [],
    explanation: {
      method: "Rule-based XAI + BKT/SM-2",
      factors: [],
    },
  }
}

function completedActivity(minutes: number): LearningActivity {
  return {
    id: "completed",
    type: "grammar_session",
    content: "Đã học",
    result: "completed",
    durationMinutes: minutes,
    createdAt: new Date().toISOString(),
  }
}

test("limits today's tasks to the learner's daily time budget", () => {
  const plan = buildDailyPlan({
    recommendations: [
      recommendation("task-1", 15),
      recommendation("task-2", 15),
      recommendation("task-3", 10),
    ],
    activities: [],
    dailyMinutes: 30,
  })

  assert.deepEqual(plan.items.map((item) => item.id), ["task-1", "task-2"])
  assert.equal(plan.plannedMinutes, 30)
})

test("keeps one main task when the first lesson is longer than the daily budget", () => {
  const plan = buildDailyPlan({
    recommendations: [recommendation("task-1", 20), recommendation("task-2", 10)],
    activities: [],
    dailyMinutes: 15,
  })

  assert.deepEqual(plan.items.map((item) => item.id), ["task-1"])
})

test("marks the daily goal complete instead of adding a task that does not fit", () => {
  const plan = buildDailyPlan({
    recommendations: [recommendation("task-2", 10)],
    activities: [completedActivity(8)],
    dailyMinutes: 15,
  })

  assert.equal(plan.items.length, 0)
  assert.equal(plan.isGoalComplete, true)
})
