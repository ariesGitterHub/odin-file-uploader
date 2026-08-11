/*
  Warnings:

  - You are about to drop the column `downloadCount` on the `share_links` table. All the data in the column will be lost.
  - You are about to drop the column `lastAccessedAt` on the `share_links` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "share_links" DROP COLUMN "downloadCount",
DROP COLUMN "lastAccessedAt",
ADD COLUMN     "download_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "last_accessed_at" TIMESTAMP(3);
