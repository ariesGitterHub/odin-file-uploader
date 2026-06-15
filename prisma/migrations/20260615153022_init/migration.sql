/*
  Warnings:

  - You are about to alter the column `folder_name` on the `folders` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(100)`.

*/
-- AlterTable
ALTER TABLE "folders" ALTER COLUMN "folder_name" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "folder_description" DROP NOT NULL;
