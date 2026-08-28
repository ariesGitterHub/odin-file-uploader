const prisma = require("../lib/prisma");
const { getUserProfileStorageSize } = require("./file.service");

// For admin.ejs, where the admin views many users
async function getAdminUserProfiles() {
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

  // For admin-edit.ejs, admin may edit a single user
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
    },
  });
}

module.exports = {
  getAdminUserProfiles,
  getAdminUserProfile,
};