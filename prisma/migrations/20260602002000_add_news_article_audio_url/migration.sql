ALTER TABLE "news_articles"
ADD COLUMN IF NOT EXISTS "audio_url" TEXT;

UPDATE "news_articles"
SET "audio_url" = NULLIF("raw_payload"->>'audioUrl', '')
WHERE "audio_url" IS NULL
  AND "raw_payload" ? 'audioUrl';
