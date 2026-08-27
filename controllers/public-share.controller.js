const fs = require("node:fs/promises");
const { ZipArchive } = require("archiver");
const path = require("node:path");
const { folderEmojis, folderEmojisDropdown } = require("../utils/folderEmojis");
const { formatBytes } = require("../utils/formatBytes");
const { formatExactDate } = require("../utils/formatDate");
const { formatMimeType, isPreviewableMimeType } = require("../utils/mimeUtils");
const { getFileById } = require("../services/file.service");

const {
  getFolderById,
  getUserFolderSize,
  getFolderSubfoldersCount,
  getFolderFilesCount,
  getFilesByFolder,
  getChildFoldersById,
  getFolderTreeForArchive,
} = require("../services/folder.service");

const {
  getShareLinkByToken,
  updateLastAccessedAt, // NOTE - this is working!
  updateDownloadCount,
} = require("../services/share.service");

// Helper function for functions below
function validateShareLink(shareLink) {
  if (!shareLink) {
    return false;
  }

  // The user has disabled the share link.
  if (!shareLink.isActive) {
    return false;
  }

  // The share link has expired.
  if (shareLink.expiresAt && shareLink.expiresAt <= new Date()) {
    return false;
  }

  // The share link has reached its download limit.
  if (
    shareLink.maxDownloads !== null &&
    shareLink.downloadCount >= shareLink.maxDownloads
  ) {
    return false;
  }

  // A share link must reference exactly one resource: either a folder or a file, but never both or neither.
  if (
    (shareLink.folderId && shareLink.fileId) ||
    (!shareLink.folderId && !shareLink.fileId)
  ) {
    return false;
  }

  return true;
}

// CONTROLLER: PUBLIC SHARE PAGE (share-page.ejs)

async function getPublicSharePage(req, res, next) {
  try {
    const token = req.params.token;

    // Find the share link using the public token.
    const shareLink = await getShareLinkByToken(token);

    if (!validateShareLink(shareLink)) {
      return res.status(404).render("404");
    }

    const expiresAtLabel = formatExactDate(shareLink.expiresAt);

    // *** FOLDER SHARE ***

    if (shareLink.folderId) {
      const folderId = shareLink.folderId;

      const folder = await getFilesByFolder(folderId);

      if (!folder) {
        return res.status(404).render("404");
      }

      const childFolders = await getChildFoldersById(folderId);
      const folderSize = await getUserFolderSize(folderId);
      const formatFolderSize = formatBytes(folderSize);
      const subfolderCount = await getFolderSubfoldersCount(folderId);
      const fileCount = await getFolderFilesCount(folderId);
      const updateLastAccessedAtFolder = await updateLastAccessedAt(
        shareLink.id,
      ); // NOTE - this is working!

      const folderWithEmoji = {
        ...folder,
        emoji: folderEmojis[folder.folderImage],
      };

      const filesWithFormattedData = folder.files.map((file) => ({
        ...file,
        sizeLabel: formatBytes(file.sizeBytes),
        mimeLabel: formatMimeType(file.mimeType),
        canPreview: isPreviewableMimeType(file.mimeType),
      }));

      folderWithEmoji.files = filesWithFormattedData;

      return res.render("share-page", {
        title: `Shared Folder: ${folder.folderName}`,
        shareLink,
        folder: folderWithEmoji,
        childFolders,
        formatFolderSize,
        subfolderCount,
        fileCount,
        expiresAtLabel,
        errors: [],
        formData: {},
      });
    }

    // *** FILE SHARE ***

    if (shareLink.fileId) {
      const file = shareLink.file;

      if (!file) {
        return res.status(404).render("404");
      }

      const formattedFile = {
        ...file,
        sizeLabel: formatBytes(file.sizeBytes),
        mimeLabel: formatMimeType(file.mimeType),
        canPreview: isPreviewableMimeType(file.mimeType),
      };

      const updateLastAccessedAtFile = await updateLastAccessedAt(shareLink.id); // NOTE - this is working!

      return res.render("share-page", {
        title: `Shared File: ${file.originalFileName}`,
        shareLink,
        file: formattedFile,
        expiresAtLabel,
        errors: [],
        formData: {},
      });
    }

    // This should be unreachable because of the validation above, but keep as a final safeguard.
    return res.status(404).render("404");
  } catch (err) {
    next(err);
  }
}

async function getPublicShareDownloadFolder(req, res, next) {
  try {
    const token = req.params.token;

    const shareLink = await getShareLinkByToken(token);

    if (!validateShareLink(shareLink)) {
      return res.status(404).render("404");
    }

    if (!shareLink.folderId || shareLink.fileId) {
      return res.status(404).render("404");
    }

    const folderId = shareLink.folderId;

    const folder = await getFolderById(folderId);

    if (!folder) {
      return res.status(404).render("404");
    }

    const folderTree = await getFolderTreeForArchive(
      folderId,
      folder.folderName,
    );

    const archive = new ZipArchive({
      zlib: { level: 9 },
    });

    archive.on("error", (err) => {
      next(err);
    });

    res.attachment(`${folder.folderName}.zip`);

    archive.pipe(res);

    for (const folder of folderTree) {
      for (const file of folder.files) {
        archive.file(path.resolve(file.cloudKey), {
          name: `${folder.zipPath}/${file.originalFileName}`,
        });
      }
    }

    await updateDownloadCount(shareLink.id);

    await archive.finalize();
  } catch (err) {
    console.error("Error during folder download:", err);
    next(err);
  }
}

async function getPublicShareDownloadFile(req, res, next) {
  try {
    const token = req.params.token;
    const shareLink = await getShareLinkByToken(token);

    if (!validateShareLink(shareLink)) {
      return res.status(404).render("404");
    }

    // This endpoint must represent a file share.
    if (!shareLink.fileId || shareLink.folderId) {
      return res.status(404).render("404");
    }

    const fileId = shareLink.fileId;
    const file = await getFileById(fileId);

    if (!file) {
      return res.status(404).render("404");
    }

    // Resolve the stored path (e.g. "uploads/1785174742641-TEST.docx")
    const filePath = path.resolve(file.cloudKey);

    // Ensures that the file still exists on disk
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).render("404");
    }

    await updateDownloadCount(shareLink.id);

    // Download using the original filename stored in the database
    res.download(filePath, file.originalFileName, (err) => {
      if (err) {
        console.error("Download error:", err);

        // If Express hasn't already started sending the response, lets your error middleware handle it.
        if (!res.headersSent) {
          return next(err);
        }
      } else {
        console.log(`Downloaded: ${file.originalFileName}`);
      }
    });
  } catch (err) {
    console.error("Error during file download:", err);
    next(err);
  }
}

async function getPublicShareFilePreview(req, res, next) {
  try {
    const token = req.params.token;
    const shareLink = await getShareLinkByToken(token);

    if (!validateShareLink(shareLink)) {
      return res.status(404).render("404");
    }

    if (!shareLink.fileId || shareLink.folderId) {
      return res.status(404).render("404");
    }
    const fileId = shareLink.fileId;
    const file = await getFileById(fileId);

    if (!file) {
      console.log("File not found:", fileId);
      return res.status(404).render("404");
    }

    // REMINDER - is MIME type on the viewable list?
    if (!isPreviewableMimeType(file.mimeType)) {
      console.log("Not previewable:", file.mimeType);
      return res.status(404).render("404");
    }

    res.type(file.mimeType);

    const filePath = path.resolve(file.cloudKey);

    console.log("cloudKey:", file.cloudKey);
    console.log("cwd:", process.cwd());
    console.log("resolved path:", filePath);

    res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPublicSharePage,
  getPublicShareDownloadFolder,
  getPublicShareDownloadFile,
  getPublicShareFilePreview,
};
