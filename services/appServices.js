const prisma = require("../lib/prisma");

// *** AUTH SERVICES

// For sign-up.ejs page
async function createUser(userData) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: userData,
    });

    await createDefaultFolders(tx, user.id); // Adds a default folder for new users to get them started

    return user;
  });
}

// For user-profile.ejs and admin-edit.ejs pages
async function updateUser(userId, userData) {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data: userData,
  });
}

// For user-folder-edit.ejs page
async function updateFolder(folderId, folderData) {
  return prisma.folder.update({
    where: {
      id: folderId,
    },
    data: folderData,
  });
}

// For user-file-edit.ejs page
async function updateFile(fileId, fileData) {
  return prisma.file.update({
    where: {
      id: fileId,
    },
    data: fileData,
  });
}

// Ensures email uniqueness
async function checkIfEmailExistsForSignUp(email) {
  return prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
    },
  });
}

async function checkIfEmailAlreadyExists(email, targetId) {
  return prisma.user.findFirst({
    where: {
      email,
      NOT: {
        id: targetId,
      },
    },
    select: {
      id: true,
    },
  });
}

// *** ADMIN SERVICES

// For admin.ejs, many users
async function getAdminUserProfiles() {
  // return prisma.user.findMany({
  const users = await prisma.user.findMany({
    select: {
      id: true,
      role: true,
      firstName: true,
      lastName: true,
      email: true,
      emailVerified: true,
      storageUsedBytes: true,
      createdAt: true,
      updatedAt: true,
      lastLoginAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const usersWithStorage = await Promise.all(
    users.map(async (user) => {
      const storageUsedBytes = await getUserProfileSize(user.id);

      return {
        ...user,
        storageUsedBytes,
      };
    }),
  );

  return usersWithStorage;
}

// For admin-edit.ejs, single user
// TODO - reduce what is grabbed here!!!! Don't need it all.
async function getAdminUserProfile(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      firstName: true,
      lastName: true,
      email: true,
      emailVerified: true,
      // storageUsedBytes: true,
      // createdAt: true,
      // updatedAt: true,
      // lastLoginAt: true,
    },
  });
}

// *** USER SERVICES

// TODO - add ejs views where these are used!

async function getUserProfile(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  });
}

async function getUserProfileSize(userId) {
  const result = await prisma.file.aggregate({
    where: {
      userId: userId,
      deletedAt: null,
    },
    _sum: {
      sizeBytes: true,
    },
  });
  console.log("USER:", userId);
  console.log("AGG RESULT:", result);

  return result._sum.sizeBytes ?? 0;
}

// Helper service
async function createDefaultFolders(tx, userId) {
  return tx.folder.create({
    data: {
      userId,
      folderName: "Default",
    },
  });
}

async function getUserFolder(folderId) {
  return prisma.folder.findUnique({
    where: {
      id: folderId,
    },
  });
}

async function getFolderById(folderId) {
  return prisma.folder.findUnique({
    where: {
      id: folderId,
    },
    select: {
      id: true,
      userId: true,
      folderName: true,
      folderImage: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

async function getFileById(fileId) {
  return prisma.file.findUnique({
    where: {
      id: fileId,
    },
    select: {
      id: true,
      folderId: true,
      userId: true,
      originalFileName: true,
      cloudProvider: true,
      cloudKey: true,
      mimeType: true,
    },
  });
}

async function getUserFolderSize(folderId) {
  const result = await prisma.file.aggregate({
    where: {
      folderId,
      deletedAt: null,
    },
    _sum: {
      sizeBytes: true,
    },
  });

  return result._sum.sizeBytes ?? 0;
}

async function getUserFolders(userId, excludedIds = []) {
  return prisma.folder.findMany({
    where: {
      userId,
      id: {
        notIn: excludedIds,
      },
    },
    orderBy: {
      folderName: "asc",
    },
  });
}

async function getDescendantFolderIds(folderId) {
  const descendants = [];

  async function traverse(parentFolderId) {
    const children = await prisma.folder.findMany({
      where: { parentFolderId },
      select: { id: true },
    });

    for (const child of children) {
      descendants.push(child.id);
      await traverse(child.id);
    }
  }

  await traverse(folderId);

  return descendants;
}

async function createFolder({
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

async function getFolderSubfoldersCount(folderId) {
  return prisma.folder.count({
    where: {
      parentFolderId: {
        contains: folderId,
      },
    },
  });
}

async function getFolderFilesCount(folderId) {
  return prisma.file.count({
    where: {
      folderId,
    },
  });
}

// REMINDER - (because I forget), only pull what I need from db...
async function getFilesByFolder(folderId) {
  return prisma.folder.findUnique({
    where: { id: folderId },
    select: {
      id: true,
      userId: true,
      parentFolderId: true,
      folderName: true,
      folderImage: true,
      folderDescription: true, // TODO - forgot to add this initially.
      createdAt: true,
      updatedAt: true,
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

async function getFilesByFolderIdForArchive(folderId) {
  return prisma.file.findMany({
    where: {
      folderId,
    },
    select: {
      id: true,
      originalFileName: true,
      cloudKey: true,
    },
    orderBy: {
      originalFileName: "asc",
    },
  });
}

async function getFolderTreeForArchive(folderId, rootFolderName) {
  const queue = [
    {
      id: folderId,
      zipPath: rootFolderName,
    },
  ];

  const results = [];

  while (queue.length > 0) {
    const current = queue.shift();

    // Get all files in the current folder
    const files = await getFilesByFolderIdForArchive(current.id);

    // Save what we discovered
    results.push({
      folderId: current.id,
      zipPath: current.zipPath,
      files,
    });

    // Find immediate child folders
    const childFolders = await getChildFoldersById(current.id);

    // Visit those folders later
    for (const child of childFolders) {
      queue.push({
        id: child.id,
        zipPath: `${current.zipPath}/${child.folderName}`, 
      });
    }
  }

  return results;
}

// Not used anymore, but KEEP for future reference. NOTE too that using below also changes the API and now file.originalFilename becomes file.original_file_name

// async function getFilesByFolder(folderId: string) {
//   return prisma.$queryRaw`
//     SELECT *
//     FROM "files"
//     WHERE "folder_id" = ${folderId} -- NOTE - using: WHERE folder_id without quotes would risk SQL injection!
//     ORDER BY LOWER("original_file_name") ASC
//   `;
// }

// async function createFile({
//   userId,
//   folderId,
//   originalFileName,
//   sizeBytes,
//   cloudKey,
//   cloudProvider,
//   mimeType,
// }) {
//   return prisma.file.create({
//     data: {
//       user: { // I was missing this too, see below, same scenario.
//         connect: {
//           id: userId
//         }
//       },
//       folderId,
//       originalFileName,
//       sizeBytes,
//       cloudKey,
//       cloudProvider,
//       mimeType,
//       folder: {
//         // I was missing this, schema.prisma says every File must have a related Folder, and folderId, with the generated Prisma client expects the relation field folder.
//         connect: {
//           id: folderId,
//         },
//       },
//     },
//   });
// }

async function createFile({
  userId,
  folderId,
  originalFileName,
  sizeBytes,
  cloudKey,
  cloudProvider,
  mimeType,
}) {
  return prisma.file.create({
    data: {
      user: {
        connect: {
          id: userId,
        },
      },
      folder: {
        connect: {
          id: folderId,
        },
      },
      originalFileName,
      sizeBytes,
      cloudKey,
      cloudProvider,
      mimeType,
    },
  });
}

// *** DELETE DATA
async function deleteUser(userId) {
  return prisma.user.delete({
    where: {
      id: userId,
    },
  });
}

async function deleteFolder(folderId) {
  return prisma.folder.delete({
    where: {
      id: folderId,
    },
  });
}

// TODO - this is a hard delete, note that I do have the db set up with a deleted_at column for soft deletes. Add soft/hard delete set up later?
async function deleteFile(fileId) {
  return prisma.file.delete({
    where: {
      id: fileId,
    },
  });
}

module.exports = {
  createUser,
  createFolder,
  createFile,

  getUserProfile,
  getFolderById,
  getFileById,  

  getUserProfileSize,
  getAdminUserProfiles, // admin
  getAdminUserProfile, // admin-edit
  getUserFolder,
  getUserFolderSize,
  getUserFolders,
  getDescendantFolderIds,
  getFolderSubfoldersCount,
  getFolderFilesCount,
  getFilesByFolder,
  getChildFoldersById,

  getFilesByFolderIdForArchive,
  getFolderTreeForArchive,

  updateUser,
  updateFolder,
  updateFile,

  deleteUser,
  deleteFolder,
  deleteFile,

  checkIfEmailExistsForSignUp,
  checkIfEmailAlreadyExists,
};
