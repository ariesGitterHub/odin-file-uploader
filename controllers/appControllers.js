const bcrypt = require("bcryptjs");
const passport = require("passport");
const { validationResult } = require("express-validator");

const {
  createUser,
  updateUser,
  // getUserByEmail,
  getUserProfile,
  getUserProfiles, // admin
  getUserFolders,
  createNewFolder,
  getFolderFilesCount,
  getFilesByFolder,
  getChildFoldersById,
  getFileById,
  deleteYourAccount,
  deleteYourFolder,
  deleteYourFile,
} = require("../services/appServices");

const passwordRules = require("../config/passwordRules"); // This populates the password-rules.ejs with the current password scheme

const { folderEmojis, folderEmojisDropdown } = require("../utils/folderEmojis")
const { formatBytes } = require("../utils/formatBytes");
const { formatRelativeDate, formatExactDate } = require("../utils/formatDate");

async function getHomePage(req, res, next) {
  try {
    res.render("index", {
      title: "Home",
    });
  } catch (err) {
    next(err);
  }
}

// *** AUTH CONTROLLERS

// CONTROLLER: SIGN-UP PAGE (sign-up.ejs)
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
  // console.log("POST /sign-up", req.body);
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
        csrfToken: req.csrfToken(),
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

// CONTROLLER: LOG-IN PAGE (log-in.ejs)
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

// async function postLogInPage(req, res, next) {
//   console.log("REQ BODY:", req.body);

//   passport.authenticate("local", async (err, user, info) => {
//     console.log("Passport fired"); // ✅ will log if strategy runs
//     if (err) return next(err);

//     if (!user) {
//       return res.render("log-in", {
//         title: "Log In",
//         errors: [
//           {
//             field: "auth",
//             message: info.message || "Invalid email or password",
//           },
//         ],
//         formData: req.body || {},
//         //csrfToken: req.csrfToken(), // Even though this is global for GET, putting this here explicitly to handle errors when validationCreateUser or validationEditUser catches an incorrect email, password, or confirm_password is used; without this here a 500 error pops off!
//       });
//     }

//     try {
//       // if ((await isMaintenanceMode()) && user.permission_status !== "admin") {
//       //   return res.redirect("/");
//       // }

//       console.log("🎈 User authenticated!"); // Keep because it is fun!

//       // Update last login
//       // await updateLastLogin(user.id);

//       // Log the user in (Passport session)
//       req.login(user, async (err) => {
//         if (err) {
//           console.error("Error during login:", err); // Log error for debugging
//           return next(err);
//         }
//         res.redirect("/app/user-data");
//         // try {
//         //   await insertSessionLog(
//         //     user.id,
//         //     req.sessionID,
//         //     req.ip,
//         //     req.headers["user-agent"],
//         //   );
//         // } catch (logErr) {
//         //   console.error("Failed to create session log:", logErr);
//         // }

//         // if (user.permission_status === "admin") {
//         //   res.redirect("/app/admin");
//         // } else {
//         //   res.redirect("/app/message-boards");
//         // }

//         // New code to check if a retention check should occur. NOTE -
//         // if (user.permission_status === "admin") {
//         //   // Check if retention jobs should run
//         //   try {
//         //     await checkAndRunRetention(user);
//         //   } catch (retentionErr) {
//         //     console.error(
//         //       "Error checking/running retention jobs:",
//         //       retentionErr,
//         //     );
//         //   }

//         //   res.redirect("/app/admin");
//         // } else {
//         //   res.redirect("/app/message-boards");
//         // }
//       });
//     } catch (err) {
//       console.error("Error updating last login:", err);
//       return next(err);
//     }
//   })(req, res, next);
// }

// CONTROLLER: LOG-OUT

async function postLogInPage(req, res, next) {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    // console.log(req.user);
    

    if (!user) {
      return res.status(401).render("log-in", {
        title: "Log In",
        errors: [
          {
            field: "auth",
            message: info?.message || "Invalid email or password",
          },
        ],
        formData: req.body,
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

// CONTROLLER: ADMIN PAGE (admin.ejs)
async function getAdminPage(req, res, next) { 
  try {
    const userProfiles = await getUserProfiles();

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
      csrfToken: req.csrfToken(),
    });
  } catch (error) {
  
}
}

// CONTROLLER: USER DATA PAGE (user-data.ejs)
async function getUserDataPage(req, res, next) {
  try {
    // if (await isMaintenanceMode()) {
    //   return res.redirect("/");
    // }

    const userId = req.user.id;

    const userFolders = await getUserFolders(userId);

    // Prevent folders with parentFolderIds from showing up as these show be shown in folder views.
    const rootFolders = userFolders.filter(
      (folder) => folder.parentFolderId === null,
    );

    const foldersWithCounts = await Promise.all(
      // userFolders.map(async (folder) => ({
      rootFolders.map(async (folder) => ({
        ...folder,
        fileCount: await getFolderFilesCount(folder.id),
      })),
    );

    const foldersWithEmoji = foldersWithCounts.map((folder) => ({
      ...folder,
      emoji: folderEmojis[folder.folderImage],
    }));

    res.render("user-data", {
      title: "User Data",
      userFolders: foldersWithEmoji,
      errors: [],
      // passwordRules,
      formData: {}, // NOTE & REMINDER: req.body is not used in GET
      csrfToken: req.csrfToken(),
    });
  } catch (err) {
    next(err);
  }
}

// CONTROLLER: USER FOLDER PAGE (user-folder.ejs) // TODO - needs slug/params
// async function getUserFolderPage(req, res, next) {
//   try {
//     const folderId = (req.params.folderId);

//     const folder = await getFilesByFolder(folderId);

//     const foldersWithEmoji = await Promise.all(folder.map((folder) => ({
//       ...folder,
//       emoji: folderEmojis[folder.folderImage],
//     })));

//     res.render("user-folder", {
//       title: folder.folderName,
//       folder: foldersWithEmoji,
//     });
//   } catch (err) {
//     next(err);
//   }
// }

async function getUserFolderPage(req, res, next) {
  try {
    const folderId = req.params.folderId;

    const folder = await getFilesByFolder(folderId);

    if (!folder) {
      return res.status(404).render("404");
    }

    const childFolders = await getChildFoldersById(folderId);

    const foldersWithCounts = await Promise.all(
      // userFolders.map(async (folder) => ({
      childFolders.map(async (folder) => ({
        ...folder,
        fileCount: await getFolderFilesCount(folder.id),
      })),
    );

    const foldersWithEmoji = foldersWithCounts.map((folder) => ({
      ...folder,
      emoji: folderEmojis[folder.folderImage],
    }));
    
    // const foldersWithEmoji = folder.map((folder) => ({
    //   ...folder,
    //   emoji: folderEmojis[folder.folderImage],
    // }));
    

    const filesWithFormattedSize = folder.files.map((f) => ({
        ...f,
        sizeLabel: formatBytes(f.sizeBytes),
        createdAtLabel: formatExactDate(f.createdAt), // or whatever your date field is
        updatedAtLabel: formatExactDate(f.updatedAt), // or whatever your date field is
      }))
      .sort((a, b) => // orders by alpha where asc cannot as prisma's asc sees "T" and "t" as different
        a.originalFileName.localeCompare(b.originalFileName, undefined, {
          sensitivity: "base",
        }),
      );;
   

    // THIS IS INTERESTING (!), adding files to folderWithEmoji
    const folderWithEmoji = {
      ...folder,
      emoji: folderEmojis[folder.folderImage],
      files: filesWithFormattedSize,
    };

// console.log({
//   folderImage: folder.folderImage,
//   // emoji: folderEmojis[folder.folderImage],
//   emoji: folderEmojis[folder.folderImage] || "📂",
//   folderEmojisKeys: Object.keys(folderEmojis),
// });
    res.render("user-folder", {
      title: folderWithEmoji.folderName,
      folder: folderWithEmoji,
      // childFolders,
      childFolders: foldersWithEmoji,
      csrfToken: req.csrfToken(),
    });
  } catch (err) {
    next(err);
  }
}

async function deleteUserFolderPage(req, res, next) {
  try {
    const folderId = req.params.folderId;

    const folder = await getFilesByFolder(folderId);

    if (!folder) {
      return res.status(404).render("404");
    }

    if (folder.userId !== req.user.id) {
      return res.sendStatus(403);
    }

    await deleteYourFolder(folderId);

    res.redirect("/app/user-data")
  } catch (err) {
    next(err);
  }
}

// async function deleteUserFile(req, res, next) {
//   try {
//     const folderId = req.params.folderId;

//     const folder = await getFilesByFolder(folderId);

//     const fileId = folder.file.id

//     const file = await getFileById(fileId);

//     if (!file) {
//       return res.status(404).render("404");
//     }

//     if (file.userId !== req.user.id) {
//       return res.sendStatus(403);
//     }

//     await deleteYourFile(fileId);

//     res.redirect("/app/user-folder/${folderId}");
//   } catch (err) {
//     next(err);
//   }
// }

// async function deleteUserFile(req, res, next) {
//   try {
//     // const { folderId, fileId } = req.params;
//     const folderId = req.params.folderId;

//     const folder = await getFilesByFolder(folderId);

//     const fileId = folder.files.id;

//     const file = getFileById(fileId)

//     if (!file) {
//       return res.status(404).render("404");
//     }

//     if (file.userId !== req.user.id) {
//       return res.sendStatus(403);
//     }

//     await deleteYourFile(fileId);

//     res.redirect(`/app/user-folder/${folderId}`);
//   } catch (err) {
//     next(err);
//   }
// }

async function deleteUserFile(req, res, next) {
  try {
    const { folderId, fileId } = req.params;
    // const folderId = req.params.folderId;

    const folder = await getFilesByFolder(folderId);

    const file = await getFileById(fileId);

    if (!file) {
      return res.status(404).render("404");
    }

    if (file.userId !== req.user.id) {
      return res.sendStatus(403);
    }

    await deleteYourFile(fileId);

    res.redirect(`/app/user-folder/${folderId}`);
  } catch (err) {
    next(err);
  }
}
// CONTROLLER: USER PROFILE PAGE (user-profile.ejs)

async function getUserProfilePage(req, res, next) {
  try {
    const userId = req.user.id;

    const userProfile = await getUserProfile(userId);

    res.render("user-profile", {
      title: "Change Your Profile",
      errors: [],
      userProfile,
      passwordRules,
      formData: {
        first_name: userProfile.firstName,
        last_name: userProfile.lastName,
        email: userProfile.email,
      },
      csrfToken: req.csrfToken(),
    });
  } catch (err) {
    next(err);
  }
}

async function postUserProfilePage(req, res, next) {
  // console.log("POST /user-profile", req.body);
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

      return res.render("user-profile", {
        title: "Change Your Profile",
        errors: formattedErrors,
        formData: req.body || {},
        passwordRules,
        csrfToken: req.csrfToken(),
      });
    }

    const { first_name, last_name, email, password } = req.body;

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

    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 12);
    }

    await updateUser(req.user.id, updateData);

    return res.redirect("/app/user-data");
  } catch (err) {
    console.error("Error during user profile update:", err);
    next(err);
  }
}

async function deleteUserProfileAndAllUserData(req, res, next) { // This cascades to all user data
    if (!req.user) {
    return res.redirect("/app/log-in");
  }

  try {
    // Block admins from deleting their own accounts
    if (req.user.role === "ADMIN") {
      const err = new Error("Admins cannot delete their own accounts.");
      err.status = 403;
      err.code = "ADMIN_SELF_DELETE_BLOCKED"; // FIX: structured error
      return next(err);
    }

    await deleteYourAccount(req.user.id);
    return res.redirect("/app");
  } catch (err) {
    next(err);
  }
}

// CONTROLLER: NEW FOLDER PAGE (new-folder.ejs)
async function getNewFolderPage(req, res, next) {
  try {
    const userId = req.user.id;

    const userFolders = await getUserFolders(userId);

    // const parentFolderId = req.body.parent_folder_id || null; // ADD TO POST!

    res.render("new-folder", {
      title: "Create Folder",
      errors: [],
      folderEmojisDropdown,
      userFolders,
      // passwordRules,
      formData: {}, // NOTE & REMINDER: req.body is not used in GET
    });
  } catch (err) {
    next(err);
  }
}

async function postNewFolderPage(req, res, next) {
  try {
    const userId = req.user.id;

    const userFolders = await getUserFolders(userId);

    // 1. Extract form data
    const { folder_name, parent_folder_id, folder_image, folder_description } =
      req.body;

    // 2. Normalize parent folder and folder description (important for NULL support)
    const normalizedParentFolderId = parent_folder_id || null;
    const normalizedFolderDescription = folder_description || null;

    // 3. Basic validation
    const errors = [];

    if (!folder_name || folder_name.trim() === "") {
      errors.push("Folder name is required");
    }

    if (errors.length > 0) {
      return res.status(400).render("new-folder", {
        title: "Create Folder",
        errors,
        userFolders,
        folderEmojisDropdown,
        formData: req.body, // keep user input
      });
    }

    // 4. Create folder (service layer)
    await createNewFolder({
      userId,
      parentFolderId: normalizedParentFolderId,
      folderName: folder_name.trim(),
      folderImage: folder_image,
      folderDescription: normalizedFolderDescription,
    });

    // 5. Redirect after success
    return res.redirect("/app/user-data");
  } catch (err) {
    next(err);
  }
}
// CONTROLLER: NEW FILE PAGE (new-file.ejs)
async function getNewFilePage(req, res, next) {
  try {
    const userId = req.user.id;

    const userFolders = await getUserFolders(userId);
    res.render("new-file", {
      title: "Upload File",
      errors: [],
      // folderEmojisDropdown,
      // passwordRules,
      userFolders,
      formData: {}, // NOTE & REMINDER: req.body is not used in GET
      csrfToken: req.csrfToken(),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getHomePage,
  getSignUpPage,
  postSignUpPage,
  getLogInPage,
  postLogInPage,
  postLogOut,
  getAdminPage,
  getUserDataPage,
  getUserFolderPage,
  deleteUserFolderPage,
  deleteUserFile,
  getUserProfilePage,
  postUserProfilePage,
  deleteUserProfileAndAllUserData,
  getNewFolderPage,
  postNewFolderPage,
  getNewFilePage,
};
