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

export function createStudyAgentTools(user: ToolUser) {
  return {
    searchKnowledge: tool({
      description:
        "Search the app knowledge base across vocabulary, grammar, quiz, and imported reading articles. Use this for factual Japanese learning questions.",
      inputSchema: z.object({
        query: z.string().describe("Search query in Vietnamese, Japanese, hiragana, romaji, or mixed text."),
        limit: z.number().int().min(1).max(8).optional().default(5),
      }),
      execute: async ({ query, limit }) => {
        const sources = await retrieveSourcesFromDatabase(query, limit)

        return {
          query,
          count: sources.length,
          sources: sources.map((source) => ({
            id: source.id,
            type: source.type,
            title: source.title,
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
  }
}
