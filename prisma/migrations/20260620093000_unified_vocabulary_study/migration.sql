-- CreateEnum
CREATE TYPE "VocabularyLearningStage" AS ENUM ('learning', 'review', 'mastered');

-- CreateEnum
CREATE TYPE "VocabularyStudySessionKind" AS ENUM ('new', 'review', 'topic', 'seeded');

-- CreateEnum
CREATE TYPE "VocabularyStudySessionStatus" AS ENUM ('active', 'completed', 'abandoned');

-- CreateEnum
CREATE TYPE "VocabularyRating" AS ENUM ('forgot', 'hard', 'remembered');

-- Extend vocabulary metadata while retaining the legacy display labels.
ALTER TABLE "vocabulary"
ADD COLUMN "topic_key" TEXT NOT NULL DEFAULT 'other',
ADD COLUMN "part_of_speech" TEXT NOT NULL DEFAULT 'expression';

-- Preserve legacy progress while migrating it to the SM-2 state model.
CREATE TABLE IF NOT EXISTS "user_vocabulary_progress_backup_20260620" AS
SELECT
  "user_id",
  "vocabulary_id",
  "status"::text AS "status",
  "last_reviewed_at",
  "next_review_at",
  "created_at",
  "updated_at"
FROM "user_vocabulary_progress";

ALTER TABLE "user_vocabulary_progress"
ADD COLUMN "stage" "VocabularyLearningStage",
ADD COLUMN "repetitions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "interval_days" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "ease_factor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
ADD COLUMN "last_quality" INTEGER,
ADD COLUMN "lapses" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "due_at" TIMESTAMP(3);

UPDATE "user_vocabulary_progress"
SET
  "stage" = CASE
    WHEN "status" = 'learned' THEN 'review'::"VocabularyLearningStage"
    ELSE 'learning'::"VocabularyLearningStage"
  END,
  "repetitions" = CASE WHEN "status" = 'learned' THEN 1 ELSE 0 END,
  "interval_days" = 1,
  "last_quality" = CASE WHEN "status" = 'learned' THEN 5 ELSE 1 END,
  "lapses" = CASE WHEN "status" = 'review' THEN 1 ELSE 0 END,
  "due_at" = COALESCE("next_review_at", "last_reviewed_at", CURRENT_TIMESTAMP);

ALTER TABLE "user_vocabulary_progress"
ALTER COLUMN "stage" SET NOT NULL,
ALTER COLUMN "stage" SET DEFAULT 'learning',
ALTER COLUMN "due_at" SET NOT NULL,
ALTER COLUMN "due_at" SET DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "status",
DROP COLUMN "next_review_at";

DROP TYPE "VocabularyProgressStatus";

-- CreateTable
CREATE TABLE "vocabulary_study_sessions" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "kind" "VocabularyStudySessionKind" NOT NULL,
  "topic_key" TEXT,
  "seed_vocabulary_id" INTEGER,
  "status" "VocabularyStudySessionStatus" NOT NULL DEFAULT 'active',
  "current_position" INTEGER NOT NULL DEFAULT 0,
  "total_items" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "completed_at" TIMESTAMP(3),
  CONSTRAINT "vocabulary_study_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vocabulary_study_session_items" (
  "session_id" TEXT NOT NULL,
  "vocabulary_id" INTEGER NOT NULL,
  "position" INTEGER NOT NULL,
  "rating" "VocabularyRating",
  "answered_at" TIMESTAMP(3),
  CONSTRAINT "vocabulary_study_session_items_pkey" PRIMARY KEY ("session_id", "vocabulary_id")
);

CREATE INDEX "user_vocabulary_progress_user_id_due_at_idx"
ON "user_vocabulary_progress"("user_id", "due_at");

CREATE INDEX "vocabulary_study_sessions_user_id_status_kind_topic_key_idx"
ON "vocabulary_study_sessions"("user_id", "status", "kind", "topic_key");

CREATE UNIQUE INDEX "vocabulary_study_session_items_session_id_position_key"
ON "vocabulary_study_session_items"("session_id", "position");

CREATE UNIQUE INDEX "vocabulary_study_sessions_one_active_scope"
ON "vocabulary_study_sessions"(
  "user_id",
  "kind",
  COALESCE("topic_key", ''),
  COALESCE("seed_vocabulary_id", -1)
)
WHERE "status" = 'active';

ALTER TABLE "vocabulary_study_sessions"
ADD CONSTRAINT "vocabulary_study_sessions_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "vocabulary_study_session_items"
ADD CONSTRAINT "vocabulary_study_session_items_session_id_fkey"
FOREIGN KEY ("session_id") REFERENCES "vocabulary_study_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "vocabulary_study_session_items"
ADD CONSTRAINT "vocabulary_study_session_items_vocabulary_id_fkey"
FOREIGN KEY ("vocabulary_id") REFERENCES "vocabulary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
