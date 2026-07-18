/*
  Warnings:

  - The values [🏖️] on the enum `FolderEmoji` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "FolderEmoji_new" AS ENUM ('📁', '📄', '📸', '🎧', '🎬', '🗃️', '🗑️', '🎨️', '💾', '📚', '✍️', '🎂', '👪', '⭐', '💰', '🏃', '🕹️', '😂', '💡', '🧠', '📋', '♥️', '💻', '🚧', '🧩', '🧾', '🍲', '🗡️', '🎓', '⛱️️', '💼');
ALTER TABLE "public"."folders" ALTER COLUMN "folder_image" DROP DEFAULT;
ALTER TABLE "folders" ALTER COLUMN "folder_image" TYPE "FolderEmoji_new" USING ("folder_image"::text::"FolderEmoji_new");
ALTER TYPE "FolderEmoji" RENAME TO "FolderEmoji_old";
ALTER TYPE "FolderEmoji_new" RENAME TO "FolderEmoji";
DROP TYPE "public"."FolderEmoji_old";
ALTER TABLE "folders" ALTER COLUMN "folder_image" SET DEFAULT '📁';
COMMIT;

-- DropForeignKey
ALTER TABLE "files" DROP CONSTRAINT "files_folder_id_fkey";

-- DropForeignKey
ALTER TABLE "folders" DROP CONSTRAINT "folders_parent_folder_id_fkey";

-- DropForeignKey
ALTER TABLE "share_links" DROP CONSTRAINT "share_links_file_id_fkey";

-- DropForeignKey
ALTER TABLE "share_links" DROP CONSTRAINT "share_links_folder_id_fkey";

-- DropForeignKey
ALTER TABLE "versions" DROP CONSTRAINT "versions_file_id_fkey";

-- AddForeignKey
ALTER TABLE "folders" ADD CONSTRAINT "folders_parent_folder_id_fkey" FOREIGN KEY ("parent_folder_id") REFERENCES "folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versions" ADD CONSTRAINT "versions_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
