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


  const createAdminDefaultFolder = await prisma.folder.create({
    data: {
      userId: "1fd8d3a4-2f39-4438-941f-0f96e67c0406",
      folderName: "Default",
    },
  });


  // console.log(deleteUser);
  console.log(createAdminDefaultFolder);
  //  console.log("Created folder:", folder);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());