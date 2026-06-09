-- CreateEnum
CREATE TYPE "FolderEmoji" AS ENUM ('📄', '📸', '🖼', '📻', '🎧', '📹', '🎬', '🎞', '🗄', '🗃', '🗑️', '📁', '📂', '🎨️', '💾', '📚', '✍️', '🎂', '👪', '⭐', '💰', '🏃', '💡', '🧠', '📋', '🤍', '💻', '🚧', '🧩', '🧾', '🍲', '🎓', '🗡', '🏖️', '💼');

-- DropForeignKey
ALTER TABLE "files" DROP CONSTRAINT "files_user_id_fkey";

-- DropForeignKey
ALTER TABLE "folders" DROP CONSTRAINT "folders_user_id_fkey";

-- DropForeignKey
ALTER TABLE "share_links" DROP CONSTRAINT "share_links_user_id_fkey";

-- DropForeignKey
ALTER TABLE "versions" DROP CONSTRAINT "versions_user_id_fkey";

-- AlterTable
ALTER TABLE "folders" ADD COLUMN     "folderImage" "FolderEmoji" NOT NULL DEFAULT '📁';

-- AddForeignKey
ALTER TABLE "folders" ADD CONSTRAINT "folders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versions" ADD CONSTRAINT "versions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
