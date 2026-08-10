-- AlterTable
ALTER TABLE "share_links" ADD COLUMN     "downloadCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastAccessedAt" TIMESTAMP(3);
