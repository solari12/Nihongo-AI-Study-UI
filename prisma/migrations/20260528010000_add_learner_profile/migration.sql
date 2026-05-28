CREATE TYPE "LearningGoal" AS ENUM ('JLPT_N5', 'COMMUNICATION', 'FROM_ZERO');
CREATE TYPE "KanaLevel" AS ENUM ('none', 'hiragana', 'hiragana_katakana');
CREATE TYPE "ExperienceLevel" AS ENUM ('new', 'some', 'returning');
CREATE TYPE "InitialLevel" AS ENUM ('absolute_beginner', 'early_n5', 'n5_review');

CREATE TABLE "learner_profiles" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "user_id" TEXT NOT NULL,
  "goal" "LearningGoal" NOT NULL,
  "kana_level" "KanaLevel" NOT NULL,
  "daily_minutes" INTEGER NOT NULL,
  "experience" "ExperienceLevel" NOT NULL,
  "preferred_topics" JSONB NOT NULL,
  "cold_start_score" INTEGER NOT NULL,
  "cold_start_reasons" JSONB NOT NULL,
  "guide_completed_steps" JSONB NOT NULL,
  "completed_onboarding" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "learner_profiles_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "learner_profiles_user_id_key" UNIQUE ("user_id"),
  CONSTRAINT "learner_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "placement_results" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "user_id" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "total" INTEGER NOT NULL,
  "percentage" INTEGER NOT NULL,
  "level" "InitialLevel" NOT NULL,
  "weak_areas" JSONB NOT NULL,
  "recommended_start" TEXT NOT NULL,
  "completed_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "placement_results_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "placement_results_user_id_key" UNIQUE ("user_id"),
  CONSTRAINT "placement_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
