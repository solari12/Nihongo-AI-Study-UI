ALTER TABLE "news_articles"
ADD COLUMN IF NOT EXISTS "category" TEXT;

UPDATE "news_articles"
SET "category" = NULLIF("raw_payload"->>'category', '')
WHERE "category" IS NULL
  AND "raw_payload" ? 'category';
