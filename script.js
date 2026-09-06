// NOTE - script.js is a standalone executable file used to run one-off or administrative Prisma operations outside the normal application flow. For a small project, having a single root-level script.js is perfectly reasonable, BUT as projects grow, developers often outgrow the single file because they accumulate lots of tasks like:

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

// In terminal use ----> node script.js to RUN this script.js file and add stuff to the db.

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  // One off Prisma Queries go here. Like creating a User to test, or if seed.js was not used.
  //  const folder = await prisma.folder.create({
  //    data: {
  //      userId: "9c8716d9-c49f-413b-9ad8-3b2f7a5fb6a1", // Required relation to a User
  //      folderName: "My New Folder",
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

  const userId = "xxxxxxx-long-user-id-xxxxxxxx"; // Look up the useId in the db (with psql in bash) and use it below
  const folderId = "xxxxxxx-long-folder-id-xxxxxxxx"; // Look up up the folderId in the db (with psql in bash) and use it below

  // const createAdminFolders = await prisma.folder.createMany({
  //   data: [
  //     {
  //       userId: userId, // See userId above
  //       folderName: "Documents",
  //       folderImage: "DOCUMENT",
  //       folderDescription: "All your documents go here...",
  //     },
  //     {
  //       userId: userId, // See userId above
  //       folderName: "Images",
  //       folderImage: "IMAGE",
  //       folderDescription: "All your image files go here...",
  //     },
  //     {
  //       userId: userId, // See userId above
  //       folderName: "Audio",
  //       folderImage: "AUDIO",
  //       folderDescription: "All your sound files go here...",
  //     },
  //     {
  //       userId: userId, // See userId above
  //       folderName: "Video",
  //       folderImage: "VIDEO",
  //       folderDescription: "All your video files go here...",
  //     },
  //   ],
  // });

  // console.log(createAdminFolders);

  // const createDocumentFiles = await prisma.file.createMany({
  //   data: [
  //     {
  //       folderId: folderId, // See userId above
  //       userId: userId,
  //       // fileName: "hjfhfhih1",
  //       originalFileName: "testMcTesty1.pdf",
  //       mimeType: "application/pdf",
  //       sizeBytes: 842n,
  //       cloudKey: "a3f1c2e9-9c2b-4a1d-8f2a-1c9d0e7b3a21.pdf",
  //       cloudProvider: "CLOUDFLARE_R2",
  //     },
  //     {
  //       folderId: folderId, // See userId above
  //       userId: userId,
  //       // fileName: "hjfhfdf2",
  //       originalFileName: "That-file-thing-you-know2.pdf",
  //       mimeType: "application/pdf",
  //       sizeBytes: 15360n,
  //       cloudKey: "a4f1c2e9-9f2b-4a1d-8f2a-1c9d0e7b3a21.pdf",
  //       cloudProvider: "CLOUDFLARE_R2",
  //     },
  //   ],
  // });

  // console.log(createDocumentFiles);
  // console.log(deleteUser);
  // console.log("Created folder:", folder);
  // console.log(createFolders);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
