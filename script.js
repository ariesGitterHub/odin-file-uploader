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

  const id = "794abafe-2c92-46ae-ad5f-953cb82abe01node "; // admin
  const createAdminFolders = await prisma.folder.createMany({
    data: [
      { userId: id, folderName: "1. Documents", folderImage: "DOCUMENT" },
      { userId: id, folderName: "2. Images", folderImage: "IMAGE" },
      { userId: id, folderName: "3. Audio", folderImage: "AUDIO" },
      { userId: id, folderName: "4. Video", folderImage: "VIDEO" },
      { userId: id, folderName: "5. Archive", folderImage: "ARCHIVE" },
      { userId: id, folderName: "6. Trash", folderImage: "TRASH" },
    ],
  });

  // console.log(deleteUser);
  console.log(createAdminFolders);
  //  console.log("Created folder:", folder);
  // console.log(createFolders);
  
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
