const prisma = require("../lib/prisma");

// *** AUTH SERVICES

// async function createUser(userData) {
//   return prisma.user.create({
//     data: userData,
//   });
// }

// For sign-up.ejs page
async function createUser(userData) {
  // console.log("createUser called with:", userData);
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: userData,
    });

    await createDefaultFolders(tx, user.id); // Adds a default folder for new users to get them started

    return user;
  });
}

// For user-profile.ejs page
async function updateUser(userId, userData) {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data: userData,
  });
}

// For edit-folder.ejs page
async function updateFolder(folderId, folderData) {
  return prisma.folder.update({
    where: {
      id: folderId,
    },
    data: folderData,
  });
}

// !!! TODO - add this to the relevant controllers where ensuring email uniqueness is needed.
// async function getUserByEmail(email) {
//   return prisma.user.findUnique({
//     where: {
//       email,
//     },
//   });
// }

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

// ADMIN SERVICES

// async function getAdminUserProfiles({ page = 1, limit = 50 }) { // NOTE - added pagination as an example for future reference
//   return prisma.user.findMany({
//     skip: (page - 1) * limit,
//     take: limit,
//     select: {
//       id: true,
//       role: true,
//       firstName: true,
//       lastName: true,
//       email: true,
//       emailVerified: true,
//       storageUsedBytes: true,
//       createdAt: true,
//       updatedAt: true,
//       lastLoginAt: true,
//     },
//     orderBy: {
//       createdAt: "desc",
//     },
//   });
// }

// For admin.ejs
async function getAdminUserProfiles() {
  return prisma.user.findMany({
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
}

// For admin-edit.ejs
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


// USER SERVICES

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

// async function getUserFolders(userId) {
//   return prisma.folder.findMany({
//     where: {
//       userId, // UUID string is fine here
//     },
//     orderBy: {
//       folderName: "asc", // optional, for consistent display
//     },
//   });
// }

// Fixed so that a folder cannot be its own subfolder.
// async function getUserFolders(userId, folderId = null) {
//   return prisma.folder.findMany({
//     where: {
//       userId,
//       ...(folderId && {
//         id: {
//           not: folderId,
//         },
//       }),
//     },
//     orderBy: {
//       folderName: "asc",
//     },
//   });
// }

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
      userId: true,
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

//  Is this used?
async function getFileById(fileId) {
  return prisma.file.findUnique({
    where: {
      id: fileId,
    },
    select: {
      id: true,
      userId: true,
      folderId: true,
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

// DELETE DATA
async function deleteUser(userId) {
  return prisma.user.delete({
    where: {
      id: userId,
    },
  });
}

async function deleteFolder(folderId) {
  // console.log("appServices, folderId = ", folderId);
  return prisma.folder.delete({
    where: {
      id: folderId,
    },
  });
}

async function deleteFile(fileId) {
  return prisma.file.delete({
    where: {
      id: fileId,
    },
  });
}

// async function deleteUserByAdmin(userId) {
//   return prisma.user.delete({
//     where: {
//       id: userId,
//     },
//   })
// }

module.exports = {
  createUser,
  updateUser,
  updateFolder,
  // getUserByEmail,
  checkIfEmailExistsForSignUp,
  checkIfEmailAlreadyExists,
  getUserProfile,
  getAdminUserProfiles, // admin
  getAdminUserProfile, // admin-edit
  getUserFolder,
  getUserFolders,
  getDescendantFolderIds,
  createNewFolder,
  getFolderSubfoldersCount,
  getFolderFilesCount,
  getFilesByFolder,
  getChildFoldersById,
  getFileById,
  deleteUser,
  deleteFolder,
  deleteFile,
  // deleteUserByAdmin,
};
