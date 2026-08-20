const prisma = require("../lib/prisma");

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

// Helper service for function below
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

// For user-folder-edit.ejs page
async function updateFolder(folderId, folderData) {
  return prisma.folder.update({
    where: {
      id: folderId,
    },
    data: folderData,
  });
}

// TODO - All deletes are hard delete, note that I do have the db set up with a deleted_at column for soft deletes. Add soft/hard delete set up later?

async function deleteFolder(folderId) {
  return prisma.folder.delete({
    where: {
      id: folderId,
    },
  });
}

module.exports = {
  createFolder,
  getUserFolders,
  getUserFolder,
  getFolderById,
  getUserFolderSize,
  getDescendantFolderIds,
  getFolderSubfoldersCount,
  getFolderFilesCount,
  getFilesByFolder,
  getChildFoldersById,
  getFolderTreeForArchive,
  updateFolder,
  deleteFolder,
};
