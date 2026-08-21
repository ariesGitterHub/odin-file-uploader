const prisma = require("../lib/prisma");
const crypto = require("node:crypto");

async function createFolderShareLink({
  userId,
  folderId,
  permission,
  maxDownloads,
  expiresAt,
}) {
  const token = crypto.randomBytes(32).toString("hex");

  return prisma.shareLink.create({
    data: {
      token,
      userId,
      folderId,
      permission,
      maxDownloads,
      expiresAt,
    },
  });
}

async function createFileShareLink({
  userId,
  fileId,
  permission,
  maxDownloads,
  expiresAt,
}) {
  const token = crypto.randomBytes(32).toString("hex");

  return prisma.shareLink.create({
    data: {
      token,
      userId,
      fileId,
      permission,
      maxDownloads,
      expiresAt,
    },
  });
}

async function getShareLinkById(shareLinkId) {
  return prisma.shareLink.findUnique({
    where: {
      id: shareLinkId,
    },
    select: {
      userId: true,
      token: true,
      folderId: true,
      fileId: true,
      // permission: true,
      // passwordHash: true,
      // maxDownloads: true,
      isActive: true,
      // expiresAt: true,
      // createdAt: true,
      // updatedAt: true,
      // downLoadCount: true,
      // lastAccessedAt: true,
    },
  });
}

async function getShareHistoryByFolderId(folderId, userId) {
  return prisma.shareLink.findMany({
    where: {
      folderId: folderId,
      userId: userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      token: true, // TODO - Not needed??? used now...just check uniqueness
      // folderId: true,
      // fileId: true,
      permission: true,
      downloadCount: true,
      maxDownloads: true,
      isActive: true,
      expiresAt: true,
      createdAt: true,
      updatedAt: true,
      lastAccessedAt: true,
      // folder: {
      //   select: {
      //     id: true,
      //     folderName: true,
      //   },
      // },
    },
  });
}

async function getShareHistoryByFileId(fileId, userId) {
  return prisma.shareLink.findMany({
    where: {
      fileId: fileId,
      userId: userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      token: true, // TODO - Not needed??? used now...just check uniqueness
      // folderId: true,
      fileId: true,
      permission: true,
      downloadCount: true,
      maxDownloads: true,
      isActive: true,
      expiresAt: true,
      createdAt: true,
      updatedAt: true,
      lastAccessedAt: true,
      // file: {
      //   select: {
      //     id: true,
      //     originalFileName: true,
      //   },
      // },
    },
  });
}

// For share-overview.ejs, where all share history is listed by user
async function getUserShareLinksByUserId(userId) {
  return prisma.shareLink.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      token: true,
      folderId: true,
      fileId: true,
      permission: true,
      downloadCount: true,
      maxDownloads: true,
      isActive: true,
      expiresAt: true,
      createdAt: true,
      updatedAt: true,
      lastAccessedAt: true, // I had forgotten to add this.
      folder: {
        select: {
          id: true,
          folderName: true,
        },
      },
      file: {
        select: {
          id: true,
          originalFileName: true,
        },
      },
    },
  });
}

// For share-link.ejs, where the recent share history of that folder or file is listed; one service for each (folder or file) as per the extant design I am using in the view.
async function getUserShareLinksByFolderId(folderId, userId) {
  return prisma.shareLink.findMany({
    where: {
      folderId,
      userId,
    },
    select: {
      id: true,
      token: true,
      userId: true,
      permission: true,
      downloadCount: true,
      maxDownloads: true,
      isActive: true,
      expiresAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

async function getUserShareLinksByFileId(fileId, userId) {
  return prisma.shareLink.findMany({
    where: {
      fileId,
      userId,
    },
    select: {
      id: true,
      token: true,
      userId: true,
      permission: true,
      downloadCount: true,
      maxDownloads: true,
      isActive: true,
      expiresAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

async function getShareLinkByToken(token) {
  return prisma.shareLink.findUnique({
    where: {
      token,
    },
    select: {
      id: true,
      token: true, // TODO - delete if unneeded/unused
      folderId: true,
      fileId: true,
      permission: true,
      downloadCount: true,
      maxDownloads: true,
      isActive: true,
      expiresAt: true,
      createdAt: true,
      updatedAt: true,
      lastAccessedAt: true,
      folder: {
        select: {
          id: true,
          folderName: true,
        },
      },
      file: {
        select: {
          id: true,
          originalFileName: true,
          sizeBytes: true,
          mimeType: true,
          // cloudKey: true,
          // cloudProvider: true,
        },
      },
    },
  });
}

// After user accesses the share-page.ejs, lastAccessedAt is updated
async function updateLastAccessedAt(shareLinkId) {
  return prisma.shareLink.update({
    where: {
      id: shareLinkId,
    },
    data: { lastAccessedAt: new Date() },
  });
}

// After user accesses the share-page.ejs and downloads the folder or file, downloadCount is updated
async function updateDownloadCount(shareLinkId) {
  return prisma.shareLink.update({
    where: {
      id: shareLinkId,
    },
    data: { downloadCount: { increment: 1 } },
  });
}

async function toggleShareLinkActiveStatus(shareLinkId, isActive) {
  return prisma.shareLink.update({
    where: {
      id: shareLinkId,
    },
    data: isActive,
  });
}

// TODO - All deletes are hard delete, note that I do have the db set up with a deleted_at column for soft deletes. Add soft/hard delete set up later?

async function deleteShare(shareLinkId) {
  return prisma.shareLink.delete({
    where: {
      id: shareLinkId,
    },
  });
}

module.exports = {
  createFolderShareLink,
  createFileShareLink,
  getShareLinkById,
  getShareHistoryByFolderId,
  getShareHistoryByFileId,
  getUserShareLinksByUserId,
  getUserShareLinksByFolderId,
  getUserShareLinksByFileId,
  getShareLinkByToken,
  updateLastAccessedAt,
  updateDownloadCount,
  toggleShareLinkActiveStatus,
  deleteShare,
};