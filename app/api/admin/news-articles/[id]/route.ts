import { createHash } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { requireAdminUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function knowledgeChunkIdFor(sourceUrl: string) {
  const hash = createHash("sha1").update(sourceUrl).digest("hex").slice(0, 16)
  return `todaii-news-${hash}`
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminUser()
  if (!admin) return NextResponse.json({ error: "Admin access required" }, { status: 403 })

  const { id } = await params
  const article = await prisma.newsArticle.findUnique({
    where: { id },
    select: {
      id: true,
      sourceUrl: true,
    },
  })

  if (!article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.knowledgeChunk.deleteMany({
      where: {
        OR: [
          { id: knowledgeChunkIdFor(article.sourceUrl) },
          {
            sourceType: "todaii-news",
            sourceId: article.sourceUrl,
          },
        ],
      },
    })

    await tx.newsArticle.delete({
      where: { id: article.id },
    })
  })

  return NextResponse.json({ ok: true })
}
