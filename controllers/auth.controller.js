const bcrypt = require("bcryptjs");
// const fs = require("node:fs/promises");
// const { ZipArchive } = require("archiver");
// const path = require("node:path");
const passport = require("passport");
const { validationResult } = require("express-validator");
const passwordRules = require("../config/passwordRules"); // This populates the password-rules.ejs with the current password scheme
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

const {
  createUser,
  // updateUser,
  // getUserProfile,
  // deleteUser,
} = require("../services/user.service");

// CONTROLLERS: SIGN-UP PAGE (sign-up.ejs)

async function getSignUpPage(req, res, next) {
  try {
    // if (await isMaintenanceMode()) {
    //   return res.redirect("/");
    // }

    res.render("sign-up", {
      title: "Sign Up",
      errors: [],
      passwordRules,
      formData: {}, // NOTE & REMINDER: req.body is not used in GET
    });
  } catch (err) {
    next(err);
  }
}

// This code is from a similar prior project that did not use Prisma ORM
async function postSignUpPage(req, res, next) {
  try {
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

      return res.render("sign-up", {
        title: "Sign Up",
        errors: formattedErrors,
        formData: req.body || {},
        passwordRules,
        // csrfToken: req.csrfToken(),
      });
    }

    const { first_name, last_name, email, password } = req.body;

    const password_hash = await bcrypt.hash(password, 12);

    // await insertNewUser(first_name, last_name, email, password_hash); // Old SQL query way
    await createUser({
      firstName: first_name,
      lastName: last_name,
      email: email.trim().toLowerCase(),
      passwordHash: password_hash,
    });

    return res.redirect("/app/log-in");
  } catch (err) {
    console.error("Error during sign-up:", err);
    next(err);
  }
}

// CONTROLLERS: LOG-IN PAGE (log-in.ejs)

async function getLogInPage(req, res, next) {
  try {
    // if (await isMaintenanceMode()) {
    //   return res.redirect("/");
    // }

    res.render("log-in", {
      title: "log In",
      errors: [],
      passwordRules,
      formData: {}, // NOTE & REMINDER: req.body is not used in GET
    });
  } catch (err) {
    next(err);
  }
}

async function postLogInPage(req, res, next) {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    // console.log(req.user);

    if (!user) {
      // return res.status(401).render("log-in", {
      return res.render("log-in", {
        title: "Log In",
        errors: [
          {
            field: "auth",
            // message: info?.message || "Invalid email or password",
            message: "Invalid email or password",
          },
        ],
        formData: req.body,
        csrfToken: req.csrfToken(), // !!! NOTE - Leave this be! Even though this is global for GET, putting this here explicitly to handle errors when validationCreateUser or validationEditUser catches an incorrect email, password, or confirm_password is used; without this here a 500 error pops off!
      });
    }

    req.login(user, (err) => {
      if (err) {
        return next(err);
      }

      console.log("🎈 User authenticated!");

      return res.redirect("/app/user-data");
    });
  })(req, res, next);
}

// CONTROLLER: LOG-OUT
async function postLogOut(req, res, next) {
  try {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.redirect("/app/log-in"); // Redirect to login page after logout
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSignUpPage,
  postSignUpPage,
  getLogInPage,
  postLogInPage,
  postLogOut,
};