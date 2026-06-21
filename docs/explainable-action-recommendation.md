# Explainable Action Recommendation

## Relation to the reference paper

The recommendation module follows the system pattern described in *Explainable AI for Data-Driven Feedback and Intelligent Action Recommendations to Support Students' Self-Regulation*:

1. Collect learning evidence from learner profiles, placement results, quiz attempts, vocabulary progress, and activity logs.
2. Estimate the learner state through `masteryScore`, `riskScore`, and `learningState`.
3. Rank actionable learning recommendations with a `priority` score.
4. Explain each recommendation using observable evidence and factor contributions.
5. State a concrete action and its expected outcome to support self-regulated learning.

## Current implementation

Each recommendation exposes:

- `action`: the next action the learner can perform.
- `expectedOutcome`: the expected learning result after following the action.
- `masteryScore`: a BKT-inspired estimate derived from quiz performance.
- `riskScore`: an intervention score derived from mastery, inactivity, review load, and explanation factors.
- `learningState`: `cold-start`, `at-risk`, `needs-review`, or `on-track`.
- `evidence`: observable data and factor contributions behind the recommendation.

The current implementation is transparent rule-based XAI combined with BKT/SM-2-inspired scoring. It does not claim to reproduce the paper's trained machine-learning prediction model or LIME explanations. The factor contributions serve the same product goal: making feedback understandable and actionable within the PRD scope and currently available data.

## Evaluation scenarios

- A learner without onboarding data receives a cold-start action.
- A learner with low quiz mastery receives a remediation quiz action.
- A learner with review items receives a review action with forgetting-risk evidence.
- A learner inactive for at least two days receives a short-session action.
- Dashboard and Learning Path show the recommendation reason, state scores, action, and expected outcome.
