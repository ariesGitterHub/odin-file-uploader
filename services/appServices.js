const prisma = require("../lib/prisma");

// *** AUTH SERVICES

// async function createUser(userData) {
//   return prisma.user.create({
//     data: userData,
//   });
// }

async function createUser(userData) {
  console.log("createUser called with:", userData);
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

async function getFolderFilesCount(folderId) {
  return prisma.file.count({
    where: {
      folderId,
    }
  })
}

async function getFilesByFolder(folderId) {
  // return prisma.file.findMany({
  //   where: {
  //     folderId,
  //   },
  //   orderBy: {
  //     fileName: "asc", // optional, for consistent display
  //   },
  // });
  return prisma.folder.findUnique({
  where: {
    id: folderId,
  },
  include: {
    files: {
      orderBy: {
        fileName: "asc",
      },
    },
  },
});
}

module.exports = {
  createUser,
  getUserByEmail,
  getUserFolders,
  getFolderFilesCount,
  getFilesByFolder,
};
