const prisma = require("../lib/prisma");
const { getUserProfileStorageSize } = require("./file.service");

// For admin.ejs, that views many users
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
        const storageUsedBytes = await getUserProfileStorageSize(user.id);
  
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

module.exports = {
  getAdminUserProfiles,
  getAdminUserProfile,
};