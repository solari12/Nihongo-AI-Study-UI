import { config } from "dotenv"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../lib/generated/prisma/client"
import { createEmbedding, embeddingModel, isEmbeddingVector } from "../lib/rag/embeddings"

config({ path: ".env.local" })

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured")
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
})

function embeddingInput(chunk: { sourceType: string; title: string; content: string }) {
  const maxChars = Number(process.env.OPENAI_EMBEDDING_MAX_CHARS ?? 6000)
  const content = chunk.content.length > maxChars
    ? `${chunk.content.slice(0, maxChars)}\n\n[Content truncated for embedding input]`
    : chunk.content

  return [`Source type: ${chunk.sourceType}`, `Title: ${chunk.title}`, content].join("\n")
}

async function main() {
  const chunks = await prisma.knowledgeChunk.findMany({
    orderBy: {
      createdAt: "asc",
    },
  })

  let updated = 0
  let skipped = 0
  let processed = 0

  for (const chunk of chunks) {
    processed += 1

    if (isEmbeddingVector(chunk.embedding)) {
      skipped += 1
      console.log(`Skipped ${chunk.id} (${processed}/${chunks.length})`)
      continue
    }

    let embedding: number[]
    try {
      embedding = await createEmbedding(embeddingInput(chunk))
    } catch (error) {
      console.error(`Failed embedding chunk ${chunk.id} (${processed}/${chunks.length})`)
      console.error(`Source type: ${chunk.sourceType}`)
      console.error(`Title: ${chunk.title}`)
      throw error
    }

    await prisma.knowledgeChunk.update({
      where: {
        id: chunk.id,
      },
      data: {
        embedding,
      },
    })
    updated += 1
    console.log(`Embedded ${chunk.id} (${processed}/${chunks.length})`)
  }

  console.log(`Embedding model: ${embeddingModel()}`)
  console.log(`Updated: ${updated}`)
  console.log(`Skipped existing: ${skipped}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
