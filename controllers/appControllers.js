const bcrypt = require("bcryptjs");
const passport = require("passport");
const { validationResult } = require("express-validator");

const {
  createUser,
  getUserByEmail,
  getUserFolders,
  getFolderFilesCount,
  getFilesByFolder,
} = require("../services/appServices");

const passwordRules = require("../config/passwordRules"); // This populates the password-rules.ejs with the current password scheme

const { folderEmojis, folderEmojisDropdown } = require("../utils/folderEmojis")

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
  console.log("POST /sign-up", req.body);
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
      email: email.toLowerCase(),
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
    console.log(req.user);
    

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

// CONTROLLER: USER DATA PAGE (user-data.ejs)
async function getUserDataPage(req, res, next) {
  try {
    // if (await isMaintenanceMode()) {
    //   return res.redirect("/");
    // }

    const userId = req.user.id;

    const userFolders = await getUserFolders(userId);

    const foldersWithCounts = await Promise.all(
      userFolders.map(async (folder) => ({
        ...folder,
        fileCount: await getFolderFilesCount(folder.id),
      })),
    );

    // attach emoji for rendering
    // const foldersWithEmoji = userFolders.map((folder) => ({
    //   ...folder,
    //   emoji: folderEmojis[folder.folderImage], // Prisma enum value → emoji
    // }));

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

    const folderWithEmoji = {
      ...folder,
      emoji: folderEmojis[folder.folderImage],
    };

    res.render("user-folder", {
      title: folderWithEmoji.folderName,
      folder: folderWithEmoji,
    });
  } catch (err) {
    next(err);
  }
}

// async function getUserFilesByFolderPage(res, req, next) {


// }

// CONTROLLER: NEW FOLDER PAGE (user-folder.ejs)
async function getNewFolderPage(req, res, next) {
  try {
    res.render("new-folder", {
      title: "Create Folder",
      errors: [],
      folderEmojisDropdown,
      // passwordRules,
      formData: {}, // NOTE & REMINDER: req.body is not used in GET
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
  getUserDataPage,
  getUserFolderPage,
  getNewFolderPage,
};
