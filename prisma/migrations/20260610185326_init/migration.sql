/*
  Warnings:

  - You are about to drop the column `folderImage` on the `folders` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "folders" DROP COLUMN "folderImage",
ADD COLUMN     "folder_image" "FolderEmoji" NOT NULL DEFAULT '📁';
