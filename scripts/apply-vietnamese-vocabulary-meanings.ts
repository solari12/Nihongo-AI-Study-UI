import { config } from "dotenv"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../lib/generated/prisma/client"
import { vietnameseVocabularyTerms } from "../lib/vietnamese-vocabulary-dictionary"

config({ path: ".env.local" })

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured")
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
})

async function main() {
  let updated = 0

  for (const [japanese, vietnamese] of Object.entries(vietnameseVocabularyTerms)) {
    const result = await prisma.vocabulary.updateMany({
      where: { japanese },
      data: { vietnamese },
    })
    updated += result.count
  }

  console.log(`Updated ${updated} vocabulary meanings to Vietnamese`)
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
