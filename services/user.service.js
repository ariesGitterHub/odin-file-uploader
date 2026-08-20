const prisma = require("../lib/prisma");

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

// TODO - All deletes are hard delete, note that I do have the db set up with a deleted_at column for soft deletes. Add soft/hard delete set up later?

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
