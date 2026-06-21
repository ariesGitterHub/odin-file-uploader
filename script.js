// NOTE - script.js is a standalone executable file used to run one-off or administrative Prisma operations outside the normal application flow. For a small project, having a single root-level script.js is perfectly reasonable BUT, As projects grow, developers often outgrow the single file because they accumulate lots of tasks like:

// scripts/
// ├── make-admin.js
// ├── import-users.js
// ├── cleanup-test-data.js
// └── backfill-user-slugs.js

// Uses for script.js
// E.g., For...
// Testing queries
// Inspecting database records
// Fixing bad data
// Backfilling new columns
// Promoting a user to admin
// Bulk updates
// Data imports/exports
// Debugging Prisma behavior

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  // One off Prisma Queries go here. Like creating a User to test, or if seed.js was not used.
  //  const folder = await prisma.folder.create({
  //    data: {
  //      userId: "9c8716d9-c49f-413b-9ad8-3b2f7a5fb6a1", // Required relation to a User
  //      folderName: "My New Folder",
  //      color: "#FF5733", // optional
  //      // Optional parent folder:
  //      // parentFolderId: "some-parent-folder-id",
  //    },
  //  });

  // const deleteUsers = await prisma.user.deleteMany({
  //   where: {
  //     id: {
  //       in: [
  //         "9c8716d9-c49f-413b-9ad8-3b2f7a5fb6a1",
  //         "0def7188-9a1e-4b39-8056-f6861707c36c",
  //       ],
  //     },
  //   },
  // });

  // const deleteUser = await prisma.user.delete({
  //   where: {
  //     id: "0def7188-9a1e-4b39-8056-f6861707c36c"
  //   },
  // });

  // const createAdminDefaultFolder = await prisma.folder.create({
  //   data: {
  //     userId: "1fd8d3a4-2f39-4438-941f-0f96e67c0406",
  //     folderName: "Default",
  //   },
  // });

  const userId = "794abafe-2c92-46ae-ad5f-953cb82abe01"; // admin
  const folderId = "d9a9dad7-cadb-4c61-acd7-54ac35ea6151"; // documents folder

  // const createAdminFolders = await prisma.folder.createMany({
  //   data: [
  //     { userId: userId, folderName: "1. Documents", folderImage: "DOCUMENT" },
  //     { userId: userId, folderName: "2. Images", folderImage: "IMAGE" },
  //     { userId: userId, folderName: "3. Audio", folderImage: "AUDIO" },
  //     { userId: userId, folderName: "4. Video", folderImage: "VIDEO" },
  //     { userId: userId, folderName: "5. Archive", folderImage: "ARCHIVE" },
  //     { userId: userId, folderName: "6. Trash", folderImage: "TRASH" },
  //   ],
  // });

  // console.log(createAdminFolders);

    const createDocumentFiles = await prisma.file.createMany({
      data: [
        {
          folderId: folderId,
          userId: userId,
          fileName: "hjfhfhih1",
          originalFileName: "testMcTesty1.pdf",
          mimeType: "application/pdf",
          sizeBytes: 842n,
          cloudKey: "a3f1c2e9-9c2b-4a1d-8f2a-1c9d0e7b3a21.pdf",
          cloudProvider: "CLOUDFLARE_R2",
        },
        {
          folderId: folderId,
          userId: userId,
          fileName: "hjfhfdf2",
          originalFileName: "That-file-thing-you-know2.pdf",
          mimeType: "application/pdf",
          sizeBytes: 15360n,
          cloudKey: "a4f1c2e9-9f2b-4a1d-8f2a-1c9d0e7b3a21.pdf",
          cloudProvider: "CLOUDFLARE_R2",
        },
        {
          folderId: folderId,
          userId: userId,
          fileName: "hjddeefhih3",
          originalFileName: "highwaysneardesert-gusto3.pdf",
          mimeType: "application/pdf",
          sizeBytes: 512000n,
          cloudKey: "a6f1c2e9-8c2b-4a1d-8f2b-1c9d0e7b3a21.pdf",
          cloudProvider: "CLOUDFLARE_R2",
        },
      ],
    });

    console.log(createDocumentFiles);
    
  // console.log(deleteUser);
  //  console.log("Created folder:", folder);
  // console.log(createFolders);
  
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
