CREATE TABLE "news_articles" (
    "id" TEXT NOT NULL,
    "source_url" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "article_text" TEXT NOT NULL,
    "image_url" TEXT,
    "published_at" TIMESTAMP(3),
    "questions" JSONB NOT NULL,
    "vocabulary" JSONB NOT NULL,
    "grammar" JSONB NOT NULL,
    "raw_payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_articles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "news_articles_source_url_key" ON "news_articles"("source_url");
