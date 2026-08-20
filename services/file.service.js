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

// For user-file-edit.ejs page
async function updateFile(fileId, fileData) {
  return prisma.file.update({
    where: {
      id: fileId,
    },
    data: fileData,
  });
}

// TODO - All deletes are hard delete, note that I do have the db set up with a deleted_at column for soft deletes. Add soft/hard delete set up later?

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