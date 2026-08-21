const bcrypt = require("bcryptjs");
// const fs = require("node:fs/promises");
// const { ZipArchive } = require("archiver");
// const path = require("node:path");
// const passport = require("passport");
const { validationResult } = require("express-validator");
const passwordRules = require("../config/passwordRules"); // This populates the password-rules.ejs with the current password scheme
// const { folderEmojis, folderEmojisDropdown } = require("../utils/folderEmojis");
const { formatBytes } = require("../utils/formatBytes");
const { 
  // formatRelativeDate, 
  formatExactDate 
} = require("../utils/formatDate");

// const { formatMimeType, isPreviewableMimeType } = require("../utils/mimeUtils");
// const { parseLocalDateTimeToUTC } = require("../utils/timezoneUtils");

const {
  getAdminUserProfiles,
  getAdminUserProfile,
} = require("../services/admin.service");

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

const {
  // createUser,
  updateUser,
  // getUserProfile,
  deleteUser,
} = require("../services/user.service");

// CONTROLLERS: ADMIN PAGE (admin.ejs, admin-edit.ejs)

async function getAdminPage(req, res, next) {
  if (req.user.role !== "ADMIN") {
    return res.sendStatus(403);
  }

  try {
    const userProfiles = await getAdminUserProfiles();

    const usersWithFormattedSize = userProfiles
      .map((f) => ({
        ...f,
        storageUsed: formatBytes(f.storageUsedBytes),
        createdAtLabel: formatExactDate(f.createdAt), // or whatever your date field is
        updatedAtLabel: formatExactDate(f.updatedAt), // or whatever your date field is
        lastLoginAtLabel: formatExactDate(f.lastLoginAt), // or whatever your date field is
      }))
      .sort(
        (
          a,
          b, // orders by alpha where asc cannot as prisma's asc sees "T" and "t" as different
        ) =>
          a.firstName.localeCompare(b.firstName, undefined, {
            sensitivity: "base",
          }),
      );

    res.render("admin", {
      title: "Admin",
      userProfiles: usersWithFormattedSize,
      errors: [],
      formData: {}, // NOTE & REMINDER: req.body is not used in GET
      // csrfToken: req.csrfToken(),
    });
  } catch (err) {
    next(err);
  }
}

async function getAdminEditPage(req, res, next) {
  // if (req.user.role !== "ADMIN") {
  //   return res.sendStatus(403);
  // }

  try {
    const userId = req.params.userId;
    // console.log("userID ===", userId);

    const userProfile = await getAdminUserProfile(userId);

    if (!userProfile) {
      return res.sendStatus(404);
    }

    res.render("admin-edit", {
      title: "Admin Edit",
      errors: [],
      userProfile,
      passwordRules,
      formData: {
        first_name: userProfile.firstName,
        last_name: userProfile.lastName,
        email: userProfile.email,
        email_verified: userProfile.emailVerified,
      },
      // csrfToken: req.csrfToken(),
    });
  } catch (err) {
    next(err);
  }
}

async function postAdminEditPage(req, res, next) {
  try {
    const userId = req.params.userId;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const formattedErrors = [];
      const seen = new Set();

      errors.array().forEach((err) => {
        if (!seen.has(err.path)) {
          formattedErrors.push({
            field: err.path,
            message: err.msg,
          });
          seen.add(err.path); // Seen ensures only one error per field, so your EJS shows one message for password, not multiple.
        }
      });

      return res.render("admin-edit", {
        title: "Admin Edit",
        errors: formattedErrors,
        formData: req.body || {},
        passwordRules,
        // csrfToken: req.csrfToken(),
      });
    }

    const { first_name, last_name, email, email_verified, password } = req.body;
    // console.log("req.body ===", req.body);

    const updateData = {};

    if (first_name.trim()) {
      updateData.firstName = first_name.trim();
    }

    if (last_name.trim()) {
      updateData.lastName = last_name.trim();
    }

    if (email.trim()) {
      updateData.email = email.trim().toLowerCase();
    }

    if (email_verified !== undefined) {
      updateData.emailVerified = email_verified === "true";
    }

    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 12);
    }

    await updateUser(userId, updateData);

    return res.redirect("/app/admin");
  } catch (err) {
    console.error("Error during user profile update:", err);
    next(err);
  }
}
// NOTE - pretty much similar to deleteUserProfileByUser
async function deleteUserProfileByAdmin(req, res, next) {
  // This cascades to all user data
  if (req.user.role !== "ADMIN") {
    return res.sendStatus(403);
  }

  try {
    // const { userId } = req.body;
    const userId = req.params.userId;

    // Block admins from deleting their own accounts
    if (req.user.id === userId) {
      const err = new Error("Admins cannot delete their own accounts.");
      err.status = 403;
      err.code = "ADMIN_SELF_DELETE_BLOCKED";
      return next(err);
    }

    await deleteUser(userId);
    return res.redirect("/app/admin");
    // }
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAdminPage,
  getAdminEditPage,
  postAdminEditPage,
  deleteUserProfileByAdmin,
};