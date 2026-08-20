// const bcrypt = require("bcryptjs");
const fs = require("node:fs/promises");
const { ZipArchive } = require("archiver");
const path = require("node:path");
// const passport = require("passport");
// const { validationResult } = require("express-validator");
// const passwordRules = require("../config/passwordRules"); // This populates the password-rules.ejs with the current password scheme
const { folderEmojis, folderEmojisDropdown } = require("../utils/folderEmojis");
const { formatBytes } = require("../utils/formatBytes");
const { 
  // formatRelativeDate,
  formatExactDate
 } = require("../utils/formatDate");
const { formatMimeType, isPreviewableMimeType } = require("../utils/mimeUtils");
// const { parseLocalDateTimeToUTC } = require("../utils/timezoneUtils");

// const {
//   getAdminUserProfiles,
//   getAdminUserProfile,
// } = require("../services/admin.service");

// const {
//   checkIfEmailExistsForSignUp,
//   checkIfEmailAlreadyExists,
// } = require("../services/auth.service");

const {
  // createFile,
  getFileById,
  // getUserProfileStorageSize,
  // updateFile,
  // deleteFile,
} = require("../services/file.service");

const {
  // createFolder,
  // getUserFolders,
  // getUserFolder,
  getFolderById,
  getUserFolderSize,
  // getDescendantFolderIds,
  getFolderSubfoldersCount,
  getFolderFilesCount,
  getFilesByFolder,
  getChildFoldersById,
  getFolderTreeForArchive,
  // updateFolder,
  // deleteFolder,
} = require("../services/folder.service");

const {
  // createFolderShareLink,
  // createFileShareLink,
  // getShareLinkById,
  // getShareHistoryByFolderId,
  // getShareHistoryByFileId,
  // getUserShareLinksByUserId,
  // getUserShareLinksByFolderId,
  // getUserShareLinksByFileId,
  getShareLinkByToken,
  updateLastAccessedAt,
  updateDownloadCount,
  // toggleShareLinkActiveStatus,
  // deleteShare,
} = require("../services/share.service");

// const {
//   createUser,
//   updateUser,
//   getUserProfile,
//   deleteUser,
// } = require("../services/user.service");

// CONTROLLER: PUBLIC SHARE PAGE (share-page.ejs)

async function getPublicSharePage(req, res, next) {
  try {
    const token = req.params.token;

    // Find the share link using the public token.
    const shareLink = await getShareLinkByToken(token);

    if (!validateShareLink(shareLink)) {
      return res.status(404).render("404");
    }

    // // The token does not correspond to an existing share link.
    // if (!shareLink) {
    //   return res.status(404).render("404");
    // }

    // // The owner has disabled the share link.
    // if (!shareLink.isActive) {
    //   return res.status(404).render("404");
    // }

    // // The share link has expired.
    // if (shareLink.expiresAt && shareLink.expiresAt <= new Date()) {
    //   return res.status(404).render("404");
    // }

    // // The share link has reached its download limit.
    // if (
    //   shareLink.maxDownloads !== null &&
    //   shareLink.downloadCount >= shareLink.maxDownloads
    // ) {
    //   return res.status(404).render("404");
    // }

    // A ShareLink should reference either a folder OR a file,
    // but never both or neither.
    // if (
    //   (shareLink.folderId && shareLink.fileId) ||
    //   (!shareLink.folderId && !shareLink.fileId)
    // ) {
    //   return res.status(404).render("404");
    // }

    const expiresAtLabel = formatExactDate(shareLink.expiresAt);

    // --------------------------------------------------
    // FOLDER SHARE
    // --------------------------------------------------

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
      );

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
      // .sort((a, b) =>
      //   a.originalFileName.localeCompare(b.originalFileName, undefined, {
      //     sensitivity: "base",
      //   }),
      // );

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
        // updateLastAccessedAtFolder,
        errors: [],
        formData: {},
      });
    }

    // --------------------------------------------------
    // FILE SHARE
    // --------------------------------------------------

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

      const updateLastAccessedAtFile = await updateLastAccessedAt(shareLink.id);

      return res.render("share-page", {
        title: `Shared File: ${file.originalFileName}`,
        shareLink,
        file: formattedFile,
        expiresAtLabel,
        // updateLastAccessedAtFile,
        errors: [],
        formData: {},
      });
    }

    // This should be unreachable because of the validation above,
    // but keep a final safeguard.
    return res.status(404).render("404");
  } catch (err) {
    next(err);
  }
}

// Helper function for functions below
function validateShareLink(shareLink) {
  if (!shareLink) {
    return false;
  }

  // The owner has disabled the share link.
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

  // A share link must reference exactly one resource:
  // either a folder or a file, but never both or neither.
  if (
    (shareLink.folderId && shareLink.fileId) ||
    (!shareLink.folderId && !shareLink.fileId)
  ) {
    return false;
  }

  return true;
}

async function getPublicShareDownloadFolder(req,res,next) {
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

    // Folder doesn't exist
    if (!folder) {
      return res.status(404).render("404");
    }

    const folderTree = await getFolderTreeForArchive(
      folderId,
      folder.folderName,
    );

    // const archive = archiver("zip", {
    //   zlib: { level: 9 },
    // });

    const archive = new ZipArchive({
      zlib: { level: 9 },
    });

    archive.on("error", (err) => {
      next(err);
    });

    // res.attachment(`${folder.name}.zip`);
    res.attachment(`${folder.folderName}.zip`);

    archive.pipe(res);

    for (const folder of folderTree) {
      for (const file of folder.files) {
        archive.file(path.resolve(file.cloudKey), {
          name: `${folder.zipPath}/${file.originalFileName}`,
        });
      }
    }

    // console.log(JSON.stringify(folderTree, null, 2));

    await updateDownloadCount(shareLink.id);

    await archive.finalize();
  } catch (err) {
    console.error("Error during folder download:", err);
    next(err);
  }
}

async function getPublicShareDownloadFile(req,res,next) {
  try {
    const token = req.params.token;
    const shareLink = await getShareLinkByToken(token);

    if (!validateShareLink(shareLink)) {
      return res.status(404).render("404");
    }

    // if (!shareLink) {
    //   return res.status(404).render("404");
    // }

    // // The owner has disabled the share link.
    // if (!shareLink.isActive) {
    //   return res.status(404).render("404");
    // }

    // // The share link has expired.
    // if (shareLink.expiresAt && shareLink.expiresAt <= new Date()) {
    //   return res.status(404).render("404");
    // }

    // // The share link has reached its download limit.
    // if (
    //   shareLink.maxDownloads !== null &&
    //   shareLink.downloadCount >= shareLink.maxDownloads
    // ) {
    //   return res.status(404).render("404");
    // }

    // This endpoint must represent a file share.
    if (!shareLink.fileId || shareLink.folderId) {
      return res.status(404).render("404");
    }

    const fileId = shareLink.fileId;
    const file = await getFileById(fileId);

    // File doesn't exist
    if (!file) {
      return res.status(404).render("404");
    }

    // Resolve the stored path (e.g. "uploads/1785174742641-TEST.docx")
    const filePath = path.resolve(file.cloudKey);

    // Ensure the file still exists on disk
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

        // If Express hasn't already started sending the response,
        // let your error middleware handle it.
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

    // console.log(file.mimeType);
    // console.log(isPreviewableMimeType(file.mimeType));

    // File doesn't exist
    if (!file) {
      console.log("File not found:", fileId);
      return res.status(404).render("404");
    }

    // Is MIME type on the viewable list?
    if (!isPreviewableMimeType(file.mimeType)) {
      console.log("Not previewable:", file.mimeType);
      return res.status(404).render("404");
    }

    res.type(file.mimeType);
    // res.sendFile(path.resolve(file.cloudKey));

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