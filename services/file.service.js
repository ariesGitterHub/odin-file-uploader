const prisma = require("../lib/prisma");

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

async function getUserProfileStorageSize(userId) {
  const result = await prisma.file.aggregate({
    where: {
      userId: userId,
      deletedAt: null, // Keep this here in case I change my current hard delete set up to a soft delete/hard delete set up later
    },
    _sum: {
      sizeBytes: true,
    },
  });

  // return result._sum.sizeBytes ?? 0;

  // NOTE - Below are the same, but 0n is simply JavaScript's BigInt literal syntax
  // return result._sum.sizeBytes ?? BigInt(0);
  return result._sum.sizeBytes ?? 0n;
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

async function deleteFile(fileId) {
  return prisma.file.delete({
    where: {
      id: fileId,
    },
  });
}

module.exports = {
  createFile,
  getFileById,
  getUserProfileStorageSize,
  updateFile,
  deleteFile,
};
