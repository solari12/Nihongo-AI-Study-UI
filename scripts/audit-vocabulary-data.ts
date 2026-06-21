import { config } from "dotenv"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../lib/generated/prisma/client"

config({ path: ".env.local" })

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error("DATABASE_URL is not configured")

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
})

const validParts = new Set([
  "noun",
  "verb",
  "i_adjective",
  "na_adjective",
  "adverb",
  "particle",
  "counter",
  "expression",
])
const validTopics = new Set([
  "greetings",
  "family",
  "school",
  "time",
  "numbers",
  "food",
  "places",
  "transport",
  "objects",
  "people_jobs",
  "health",
  "colors",
  "nature",
  "verbs",
  "adjectives",
  "other",
])

async function main() {
  const vocabulary = await prisma.vocabulary.findMany({ orderBy: { id: "asc" } })
  const issues: string[] = []
  const seen = new Set<string>()

  for (const item of vocabulary) {
    const key = `${item.japanese}:${item.hiragana}`
    if (seen.has(key)) issues.push(`#${item.id} duplicate ${key}`)
    seen.add(key)
    if (!validParts.has(item.partOfSpeech)) issues.push(`#${item.id} invalid partOfSpeech ${item.partOfSpeech}`)
    if (!validTopics.has(item.topicKey)) issues.push(`#${item.id} invalid topicKey ${item.topicKey}`)
    if (/^\[Cần dịch\]|^Study\b/i.test(item.vietnamese)) issues.push(`#${item.id} untranslated meaning`)
    if (item.exampleJapanese === `${item.japanese}を勉強します。`) {
      issues.push(`#${item.id} generated study example`)
    }
    if (/^Study\b/i.test(item.exampleVietnamese)) issues.push(`#${item.id} English example translation`)
    if (
      !item.exampleJapanese.includes(item.japanese) &&
      !["verb", "i_adjective", "na_adjective"].includes(item.partOfSpeech)
    ) {
      issues.push(`#${item.id} example does not contain target`)
    }
  }

  console.log(JSON.stringify({
    total: vocabulary.length,
    issueCount: issues.length,
    issues,
  }, null, 2))

  if (issues.length) process.exitCode = 1
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
