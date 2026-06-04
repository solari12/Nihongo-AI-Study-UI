import { tool } from "ai"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { retrieveSourcesFromDatabase } from "@/lib/rag/retriever"

type ToolUser = {
  id: string
  name: string
  email: string
  role: "learner" | "admin"
}

function compactText(value: string, maxLength = 700) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5)
}

export function createStudyAgentTools(user: ToolUser) {
  return {
    searchKnowledge: tool({
      description:
        "Search the app knowledge base across vocabulary, grammar, quiz, and imported reading articles. Use this for factual Japanese learning questions.",
      inputSchema: z.object({
        query: z.string().describe("Search query in Vietnamese, Japanese, hiragana, romaji, or mixed text."),
        limit: z.number().int().min(1).max(8).optional().default(5),
        sourceTypes: z
          .array(z.enum(["vocabulary", "grammar", "quiz", "news"]))
          .optional()
          .describe("Optional source types to require, for example ['news'] when the learner asks for reading articles."),
      }),
      execute: async ({ query, limit, sourceTypes }) => {
        const sources = await retrieveSourcesFromDatabase(
          query,
          limit,
          sourceTypes?.length ? { preferredTypes: sourceTypes, requireTypes: sourceTypes } : undefined
        )

        return {
          query,
          count: sources.length,
          sources: sources.map((source) => ({
            id: source.id,
            type: source.type,
            title: source.title,
            sourceId: source.sourceId,
            href: source.href,
            score: source.score,
            content: compactText(source.content),
          })),
        }
      },
    }),
    getUserProgress: tool({
      description:
        "Get the current learner progress, review workload, quiz history, and recent activities. Use this before giving personalized study plans.",
      inputSchema: z.object({}),
      execute: async () => {
        const [vocabularyTotal, learnedVocabulary, reviewVocabulary, grammarTotal, quizAttempts, recentActivities] =
          await Promise.all([
            prisma.vocabulary.count(),
            prisma.userVocabularyProgress.count({
              where: {
                userId: user.id,
                status: "learned",
              },
            }),
            prisma.userVocabularyProgress.count({
              where: {
                userId: user.id,
                status: "review",
              },
            }),
            prisma.grammar.count(),
            prisma.quizAttempt.findMany({
              where: {
                userId: user.id,
              },
              orderBy: {
                createdAt: "desc",
              },
              take: 10,
            }),
            prisma.activityLog.findMany({
              where: {
                userId: user.id,
              },
              orderBy: {
                createdAt: "desc",
              },
              take: 8,
            }),
          ])
        const averageQuizScore = quizAttempts.length
          ? Math.round(quizAttempts.reduce((total, attempt) => total + attempt.percentage, 0) / quizAttempts.length)
          : 0

        return {
          vocabulary: {
            total: vocabularyTotal,
            learned: learnedVocabulary,
            review: reviewVocabulary,
          },
          grammar: {
            total: grammarTotal,
          },
          quiz: {
            attempts: quizAttempts.length,
            latestScore: quizAttempts[0]?.percentage ?? 0,
            averageScore: averageQuizScore,
            recent: quizAttempts.map((attempt) => ({
              type: attempt.quizType,
              score: attempt.score,
              total: attempt.total,
              percentage: attempt.percentage,
              createdAt: attempt.createdAt.toISOString(),
            })),
          },
          recentActivities: recentActivities.map((activity) => ({
            type: activity.type,
            content: activity.content,
            topic: activity.topic,
            result: activity.result,
            score: activity.score,
            durationMinutes: activity.durationMinutes,
            createdAt: activity.createdAt.toISOString(),
          })),
        }
      },
    }),
    getLearnerProfile: tool({
      description:
        "Get learner profile, placement result, goal, daily minutes, preferred topics, and current starting level.",
      inputSchema: z.object({}),
      execute: async () => {
        const [profile, placement] = await Promise.all([
          prisma.learnerProfile.findUnique({
            where: {
              userId: user.id,
            },
          }),
          prisma.placementResult.findUnique({
            where: {
              userId: user.id,
            },
          }),
        ])

        return {
          user: {
            name: user.name,
            role: user.role,
          },
          profile: profile
            ? {
                goal: profile.goal,
                kanaLevel: profile.kanaLevel,
                dailyMinutes: profile.dailyMinutes,
                experience: profile.experience,
                preferredTopics: profile.preferredTopics,
                coldStartScore: profile.coldStartScore,
                coldStartReasons: profile.coldStartReasons,
                completedOnboarding: profile.completedOnboarding,
              }
            : null,
          placement: placement
            ? {
                score: placement.score,
                total: placement.total,
                percentage: placement.percentage,
                level: placement.level,
                weakAreas: placement.weakAreas,
                recommendedStart: placement.recommendedStart,
                completedAt: placement.completedAt.toISOString(),
              }
            : null,
        }
      },
    }),
    searchReadingArticles: tool({
      description:
        "Search imported TODAII reading articles by keyword and optional JLPT level. Use this for reading practice recommendations.",
      inputSchema: z.object({
        query: z.string().optional().default(""),
        level: z.enum(["N1", "N2", "N3", "N4", "N5"]).optional(),
        limit: z.number().int().min(1).max(8).optional().default(5),
      }),
      execute: async ({ query, level, limit }) => {
        const articles = await prisma.newsArticle.findMany({
          where: {
            level,
            OR: query
              ? [
                  { title: { contains: query } },
                  { articleText: { contains: query } },
                  { category: { contains: query } },
                ]
              : undefined,
          },
          orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
          take: limit,
        })

        return {
          query,
          level,
          count: articles.length,
          articles: articles.map((article) => ({
            id: article.id,
            title: article.title,
            level: article.level,
            category: article.category,
            hasAudio: Boolean(article.audioUrl),
            publishedAt: article.publishedAt?.toISOString() ?? null,
            excerpt: compactText(article.articleText, 450),
          })),
        }
      },
    }),
    searchGrammar: tool({
      description:
        "Search grammar patterns by keyword, meaning, structure, usage note, or example. Use this for weak areas like particles, te-form, conditionals, and N4/N5 planning.",
      inputSchema: z.object({
        query: z.string(),
        limit: z.number().int().min(1).max(10).optional().default(6),
      }),
      execute: async ({ query, limit }) => {
        const grammar = await prisma.grammar.findMany({
          where: {
            OR: [
              { pattern: { contains: query } },
              { meaning: { contains: query } },
              { structure: { contains: query } },
              { usageNote: { contains: query } },
              { exampleJapanese: { contains: query } },
              { exampleVietnamese: { contains: query } },
            ],
          },
          orderBy: {
            id: "asc",
          },
          take: limit,
        })

        return {
          query,
          count: grammar.length,
          grammar: grammar.map((item) => ({
            id: item.id,
            pattern: item.pattern,
            meaning: item.meaning,
            structure: item.structure,
            usageNote: item.usageNote,
            exampleJapanese: item.exampleJapanese,
            exampleVietnamese: item.exampleVietnamese,
            difficulty: item.difficulty,
            status: item.status,
          })),
        }
      },
    }),
    getDiagnosticQuiz: tool({
      description:
        "Get a diagnostic quiz from the project's real quiz_questions data. Use this when the learner asks to test/check their N5 or N4 level, take a mock test, or receive a diagnostic quiz. Return data only; Kami decides how to introduce and explain it.",
      inputSchema: z.object({
        level: z.enum(["N4", "N5"]).default("N5"),
        count: z.number().int().min(3).max(10).optional().default(8),
        skills: z.array(z.enum(["vocabulary", "grammar"])).optional(),
      }),
      execute: async ({ level, count, skills }) => {
        const requestedTypes: Array<"vocabulary" | "grammar"> = skills?.length
          ? skills
          : ["vocabulary", "grammar"]
        const questions = await prisma.quizQuestion.findMany({
          where: {
            type: {
              in: requestedTypes,
            },
          },
          include: {
            answers: true,
          },
          orderBy: {
            id: "asc",
          },
          take: Math.min(60, count * 6),
        })
        const selected = shuffle(questions).slice(0, count)

        return {
          kind: "diagnostic_quiz",
          level,
          requestedCount: count,
          count: selected.length,
          dataSource: "quiz_questions",
          note:
            level === "N4"
              ? "The current project quiz bank is mainly N5-oriented. Use this result to assess the learner's N5 foundation before N4."
              : "Use this quiz to assess the learner's current N5 foundation.",
          questions: selected.map((question) => ({
            id: question.id,
            question: question.question,
            type: question.type,
            difficulty: question.difficulty,
            topic: question.topic,
            options: question.answers
              .sort((a, b) => a.answerKey.localeCompare(b.answerKey))
              .map((answer) => ({
                label: answer.answerKey,
                text: answer.answerText,
              })),
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
          })),
        }
      },
    }),
    getSavedStudyItems: tool({
      description:
        "Get the learner's saved study items. Use this when asked what has been saved, what to review, or whether recent material is in saved items.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(20).optional().default(10),
        type: z.enum(["vocabulary", "grammar"]).optional(),
      }),
      execute: async ({ limit, type }) => {
        const items = await prisma.savedStudyItem.findMany({
          where: {
            userId: user.id,
            type,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: limit,
        })

        return {
          count: items.length,
          items: items.map((item) => ({
            id: item.id,
            itemKey: item.itemKey,
            sourceId: item.sourceId,
            type: item.type,
            title: item.title,
            note: item.note,
            createdAt: item.createdAt.toISOString(),
          })),
        }
      },
    }),
    getAvailableActions: tool({
      description:
        "Get the actions available in the chat UI. Use this before telling the learner how to save, create a quiz, or log an activity. This tool does not perform writes.",
      inputSchema: z.object({}),
      execute: async () => ({
        actions: [
          {
            id: "save_source",
            label: "Lưu nguồn",
            effect: "Saves the selected source to Saved study items after the learner confirms in the UI.",
          },
          {
            id: "create_quiz",
            label: "Tạo quiz",
            effect: "Requests a new quiz based on the selected answer or source.",
          },
          {
            id: "log_activity",
            label: "Ghi hoạt động",
            effect: "Writes the selected conversation to learning activity history after confirmation.",
          },
        ],
        constraint: "Kami must not claim an action was completed unless the UI/API confirms it.",
      }),
    }),
  }
}
