/*
  Warnings:

  - The values [🗑️] on the enum `FolderEmoji` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "FolderEmoji_new" AS ENUM ('📄', '📸', '🖼', '📻', '🎧', '📹', '🎬', '🎞', '🗄', '🗃', '🗑', '📁', '📂', '🎨️', '💾', '📚', '✍️', '🎂', '👪', '⭐', '💰', '🏃', '💡', '🧠', '📋', '🤍', '💻', '🚧', '🧩', '🧾', '🍲', '🎓', '🗡', '🏖️', '💼');
ALTER TABLE "public"."folders" ALTER COLUMN "folder_image" DROP DEFAULT;
ALTER TABLE "folders" ALTER COLUMN "folder_image" TYPE "FolderEmoji_new" USING ("folder_image"::text::"FolderEmoji_new");
ALTER TYPE "FolderEmoji" RENAME TO "FolderEmoji_old";
ALTER TYPE "FolderEmoji_new" RENAME TO "FolderEmoji";
DROP TYPE "public"."FolderEmoji_old";
ALTER TABLE "folders" ALTER COLUMN "folder_image" SET DEFAULT '📁';
COMMIT;
