const prisma = require("../lib/prisma");

// For sign-up.ejs page
async function createUser(userData) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: userData,
    });
    // New users automatically get a "Default" folder at sign up to get them started
    await createDefaultFolders(tx, user.id);

    return user;
  });
}

// Helper service for above
async function createDefaultFolders(tx, userId) {
  return tx.folder.create({
    data: {
      userId,
      folderName: "Default",
    },
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

// For user-profile.ejs
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

// For user-profile.ejs and admin.ejs
async function deleteUser(userId) {
  return prisma.user.delete({
    where: {
      id: userId,
    },
  });
}

module.exports = {
  createUser,
  updateUser,
  getUserProfile,
  deleteUser,
};
