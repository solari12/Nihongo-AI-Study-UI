CREATE TYPE "SavedStudyItemType" AS ENUM ('vocabulary', 'grammar');

CREATE TABLE "saved_study_items" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "SavedStudyItemType" NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "item_key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "reading" TEXT,
    "level" TEXT,
    "meaning" TEXT,
    "note" TEXT,
    "example" TEXT,
    "raw_payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_study_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "saved_study_items_user_id_type_item_key_key" ON "saved_study_items"("user_id", "type", "item_key");
CREATE INDEX "saved_study_items_user_id_type_idx" ON "saved_study_items"("user_id", "type");

ALTER TABLE "saved_study_items" ADD CONSTRAINT "saved_study_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
