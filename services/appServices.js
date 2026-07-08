const prisma = require("../lib/prisma");

// *** AUTH SERVICES

// async function createUser(userData) {
//   return prisma.user.create({
//     data: userData,
//   });
// }

async function createUser(userData) {
  // console.log("createUser called with:", userData);
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: userData,
    });

    await createDefaultFolders(tx, user.id);

    return user;
  });
}

// !!! TODO - add this to the relevant controllers where ensuring email uniqueness is needed.
async function getUserByEmail(email) {
  return prisma.user.findUnique({
    where: {
      email,
    },
  });
}

// TODO - getUserProfile START HERE!!!
async function getUserProfile(userId) {
  return prisma.user.findUnique({
    where: { id: userId, },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  });
}


// USER SERVICES

async function createDefaultFolders(tx, userId) {
  return tx.folder.create({
    data: {
      userId,
      folderName: "Default",
    },
  });
}


async function getUserFolders(userId) {
  return prisma.folder.findMany({
    where: {
      userId, // UUID string is fine here
    },
    orderBy: {
      folderName: "asc", // optional, for consistent display
    },
  });
}

async function createNewFolder({
  userId,
  parentFolderId = null,
  folderName,
  folderImage,
  folderDescription = null,
}) {
  return prisma.folder.create({
    data: {
      userId,
      parentFolderId,
      folderName,
      folderImage,
      folderDescription,
    },
  });
}

async function getFolderFilesCount(folderId) {
  return prisma.file.count({
    where: {
      folderId,
    }
  })
}

// async function getFilesByFolder(folderId) {
//   return prisma.folder.findUnique({
//   where: {
//     id: folderId,
//   },
//   include: {
//     files: {
//       orderBy: {
//         originalFileName: "asc",
//       },
//     },
//   },
// });
// }

// REMINDER - (because I forget), only pull what I need from db...
async function getFilesByFolder(folderId) {
  return prisma.folder.findUnique({
    where: { id: folderId },
    select: {
      id: true,
      parentFolderId: true,
      folderName: true,
      folderImage: true,
      folderDescription: true, // TODO - forgot to add this initially.
      parentFolder: {
        select: {
          id: true,
          folderName: true,
        },
      },
      files: {
        select: {
          id: true,
          originalFileName: true,
          mimeType: true,
          sizeBytes: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          originalFileName: "asc",
        },
      },
    },
  });
}

async function getChildFoldersById(parentFolderId) {
  return prisma.folder.findMany({
    where: {
      parentFolderId,
    },
    select: {
      id: true,
      parentFolderId: true,
      folderName: true,
      folderImage: true,
    },
    orderBy: {
      folderName: "asc",
    },
  });
}
// I use queryRaw below to correct case-insensitive alphabetical sorting, as it gives full control over SQL behavior and avoids Prisma’s collation limitations... plus it is my first time using it. Good for future reference. NOTE too that using below also changes the API and now file.originalFilename becomes file.original_file_name

// async function getFilesByFolder(folderId: string) {
//   return prisma.$queryRaw`
//     SELECT *
//     FROM "files"
//     WHERE "folder_id" = ${folderId} -- NOTE - using: WHERE folder_id without quotes would risk SQL injection!
//     ORDER BY LOWER("original_file_name") ASC
//   `;
// }

module.exports = {
  createUser,
  getUserByEmail,
  getUserProfile,
  getUserFolders,
  createNewFolder,
  getFolderFilesCount,
  getFilesByFolder,
  getChildFoldersById,
};
