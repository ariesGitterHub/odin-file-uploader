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

async function createDefaultFolders(tx, userId) {
  return tx.folder.create({
    data: {
        userId,
        folderName: "Default",
      },
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

module.exports = {
  createUser,
  getUserByEmail,
};
