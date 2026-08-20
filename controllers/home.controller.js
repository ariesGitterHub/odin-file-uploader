// const bcrypt = require("bcryptjs");
// const fs = require("node:fs/promises");
// const { ZipArchive } = require("archiver");
// const path = require("node:path");
// const passport = require("passport");
// const { validationResult } = require("express-validator");
// const passwordRules = require("../config/passwordRules"); // This populates the password-rules.ejs with the current password scheme
// const { folderEmojis, folderEmojisDropdown } = require("../utils/folderEmojis");
// const { formatBytes } = require("../utils/formatBytes");
// const { formatRelativeDate, formatExactDate } = require("../utils/formatDate");
// const { formatMimeType, isPreviewableMimeType } = require("../utils/mimeUtils");
// const { parseLocalDateTimeToUTC } = require("../utils/timezoneUtils");

// const {
//   getAdminUserProfiles,
//   getAdminUserProfile,
// } = require("../services/admin.service");

// const {
//   checkIfEmailExistsForSignUp,
//   checkIfEmailAlreadyExists,
// } = require("../services/auth.service");

// const {
//   createFile,
//   getFileById,
//   getUserProfileStorageSize,
//   updateFile,
//   deleteFile,
// } = require("../services/file.service");

// const {
//   createFolder,
//   getUserFolders,
//   getUserFolder,
//   getFolderById,
//   getUserFolderSize,
//   getDescendantFolderIds,
//   getFolderSubfoldersCount,
//   getFolderFilesCount,
//   getFilesByFolder,
//   getChildFoldersById,
//   getFolderTreeForArchive,
//   updateFolder,
//   deleteFolder,
// } = require("../services/folder.service");

// const {
//   createFolderShareLink,
//   createFileShareLink,
//   getShareLinkById,
//   getShareHistoryByFolderId,
//   getShareHistoryByFileId,
//   getUserShareLinksByUserId,
//   getUserShareLinksByFolderId,
//   getUserShareLinksByFileId,
//   getShareLinkByToken,
//   updateLastAccessedAt,
//   updateDownloadCount,
//   toggleShareLinkActiveStatus,
//   deleteShare,
// } = require("../services/share.service");

// const {
//   createUser,
//   updateUser,
//   getUserProfile,
//   deleteUser,
// } = require("../services/user.service");

// CONTROLLER: HOME (INDEX) PAGE

async function getHomePage(req, res, next) {
  try {
    res.render("index", {
      title: "Home",
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getHomePage,
}