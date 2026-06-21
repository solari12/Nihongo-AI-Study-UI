import { readFile } from "node:fs/promises"
import path from "node:path"
import { createHash } from "node:crypto"
import { config } from "dotenv"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../lib/generated/prisma/client"

config({ path: ".env.local" })

type ImportedVocabulary = {
  japanese: string
  hiragana: string
  romaji: string
  vietnamese: string
  type: string
  topic: string
  source?: {
    provider?: string
    slug?: string
    url?: string
    englishDefinitions?: string[]
    partsOfSpeech?: string[]
    isCommon?: boolean
  }
  example: {
    japanese: string
    vietnamese: string
  }
}

type ImportFile = {
  vocabulary: ImportedVocabulary[]
}

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured")
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
})

const inputPath = path.join(process.cwd(), "data", "imports", "jisho-n5-vocabulary.json")

function chunkIdFor(item: ImportedVocabulary) {
  const key = item.source?.slug ?? `${item.japanese}:${item.hiragana}`
  const hash = createHash("sha1").update(key).digest("hex").slice(0, 16)
  return `jisho-vocabulary-${hash}`
}

function englishMeaning(item: ImportedVocabulary) {
  const definitions = item.source?.englishDefinitions?.filter(Boolean) ?? []
  if (definitions.length > 0) return definitions.slice(0, 3).join("; ")

  return item.vietnamese.replace(/^\[[^\]]+\]\s*/, "")
}

function sourceUrl(item: ImportedVocabulary) {
  if (item.source?.url) return item.source.url
  return `https://jisho.org/search/${encodeURIComponent(item.source?.slug ?? item.japanese)}`
}

function buildKnowledgeContent(item: ImportedVocabulary) {
  const meaning = englishMeaning(item)
  const parts = item.source?.partsOfSpeech?.slice(0, 4).join(", ") || item.type

  return [
    `${item.japanese} (${item.hiragana}, ${item.romaji}) means ${meaning}.`,
    `Part of speech: ${parts}.`,
    `JLPT level: N5.`,
    `Source: ${sourceUrl(item)}`,
  ].join(" ")
}

async function main() {
  const raw = await readFile(inputPath, "utf8")
  const parsed = JSON.parse(raw) as ImportFile
  const maxId = await prisma.vocabulary.aggregate({ _max: { id: true } })
  let nextId = (maxId._max.id ?? 0) + 1
  let createdCount = 0
  let updatedCount = 0

  for (const item of parsed.vocabulary) {
    const existingChunk = await prisma.knowledgeChunk.findFirst({
      where: {
        id: chunkIdFor(item),
      },
      select: {
        vocabularyId: true,
      },
    })

    const existingVocabulary =
      existingChunk?.vocabularyId != null
        ? await prisma.vocabulary.findUnique({ where: { id: existingChunk.vocabularyId } })
        : await prisma.vocabulary.findFirst({
            where: {
              japanese: item.japanese,
              hiragana: item.hiragana,
            },
          })

    const id = existingVocabulary?.id ?? nextId++
    const meaning = englishMeaning(item)
    const exampleJapanese =
      item.example?.japanese && !item.example.japanese.includes("追加してください")
        ? item.example.japanese
        : `${item.japanese}を勉強します。`

    await prisma.$transaction(async (tx) => {
      await tx.vocabulary.upsert({
        where: { id },
        update: {
          japanese: item.japanese,
          hiragana: item.hiragana,
          romaji: item.romaji,
          vietnamese: meaning,
          type: item.type,
          topic: item.topic,
          topicKey: "other",
          partOfSpeech: item.type.includes("Động") ? "verb" : item.type.includes("Danh") ? "noun" : "expression",
          exampleJapanese,
          exampleVietnamese:
            item.example?.vietnamese && !item.example.vietnamese.includes("bổ sung")
              ? item.example.vietnamese
              : `Study ${meaning}.`,
        },
        create: {
          id,
          japanese: item.japanese,
          hiragana: item.hiragana,
          romaji: item.romaji,
          vietnamese: meaning,
          type: item.type,
          topic: item.topic,
          topicKey: "other",
          partOfSpeech: item.type.includes("Động") ? "verb" : item.type.includes("Danh") ? "noun" : "expression",
          exampleJapanese,
          exampleVietnamese: `Study ${meaning}.`,
        },
      })

      await tx.knowledgeChunk.upsert({
        where: { id: chunkIdFor(item) },
        update: {
          sourceType: "jisho-vocabulary",
          sourceId: item.source?.slug ?? String(id),
          title: `${item.japanese} / ${item.romaji}`,
          content: buildKnowledgeContent(item),
          vocabularyId: id,
        },
        create: {
          id: chunkIdFor(item),
          sourceType: "jisho-vocabulary",
          sourceId: item.source?.slug ?? String(id),
          title: `${item.japanese} / ${item.romaji}`,
          content: buildKnowledgeContent(item),
          vocabularyId: id,
        },
      })
    })

    if (existingVocabulary) updatedCount += 1
    else createdCount += 1
  }

  console.log(`Imported ${parsed.vocabulary.length} Jisho N5 vocabulary items`)
  console.log(`Created: ${createdCount}`)
  console.log(`Updated: ${updatedCount}`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
