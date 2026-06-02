ALTER TABLE "news_articles"
ADD COLUMN IF NOT EXISTS "level_stats" JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE "news_articles"
SET "level_stats" = COALESCE("raw_payload"->'levelStats', '[]'::jsonb)
WHERE "level_stats" = '[]'::jsonb
  AND "raw_payload" ? 'levelStats';
