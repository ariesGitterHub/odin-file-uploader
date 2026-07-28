const bcrypt = require("bcryptjs");
const fs = require("node:fs/promises");
const path = require("node:path");
const passport = require("passport");
const { validationResult } = require("express-validator");

const {
  createUser,
  createFolder,
  createFile,

  getUserProfile,
  getAdminUserProfiles, // admin
  getAdminUserProfile, // admin-edit
  getUserFolder,
  getUserFolders,
  getDescendantFolderIds,
  getFolderSubfoldersCount,
  getFolderFilesCount,
  getFilesByFolder,
  getChildFoldersById,
  getFileById, 

  updateUser,
  updateFolder,
  updateFile,

  deleteUser,
  deleteFolder,
  deleteFile,
} = require("../services/appServices");

const passwordRules = require("../config/passwordRules"); // This populates the password-rules.ejs with the current password scheme

const { folderEmojis, folderEmojisDropdown } = require("../utils/folderEmojis")
const { formatBytes } = require("../utils/formatBytes");
const { formatRelativeDate, formatExactDate } = require("../utils/formatDate");

const { formatMimeType } = require("../utils/mimeUtils");

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

// CONTROLLERS: ADMIN PAGE (admin.ejs)
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
    console.log("req.body ===", req.body);
    

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
    const { userId } = req.body;

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

// CONTROLLER: USER DATA PAGE (user-data.ejs)
async function getUserDataPage(req, res, next) {
  try {
    const userId = req.user.id;

    const userFolders = await getUserFolders(userId);

    // Prevent folders with parentFolderIds from showing up as these should be shown in folder views.
    const rootFolders = userFolders.filter(
      (folder) => folder.parentFolderId === null,
    );

    const foldersWithCounts = await Promise.all(
      // userFolders.map(async (folder) => ({
      rootFolders.map(async (folder) => ({
        ...folder,
        subfolderCount: await getFolderSubfoldersCount(folder.id),
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
      // csrfToken: req.csrfToken(),
    });
  } catch (err) {
    next(err);
  }
}

// CONTROLLERS: USER FOLDER PAGE (user-folder.ejs)
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
        subfolderCount: await getFolderSubfoldersCount(folder.id),
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
    
    const filesWithFormattedSize = folder.files
      .map((f) => ({
        ...f,
        sizeLabel: formatBytes(f.sizeBytes),
        mimeLabel: formatMimeType(f.mimeType),
        createdAtLabel: formatExactDate(f.createdAt), // or whatever your date field is
        updatedAtLabel: formatExactDate(f.updatedAt), // or whatever your date field is
      }))
      .sort(
        (
          a,
          b, // orders by alpha where asc cannot as prisma's asc sees "T" and "t" as different
        ) =>
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

    res.render("user-folder", {
      title: folderWithEmoji.folderName,
      folder: folderWithEmoji,
      // childFolders,
      childFolders: foldersWithEmoji,
      // csrfToken: req.csrfToken(),
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

    await deleteFolder(folderId);

    res.redirect("/app/user-data")
  } catch (err) {
    next(err);
  }
}

async function deleteUserFile(req, res, next) {
  try {
    const { folderId, fileId } = req.params;
    // const folderId = req.params.folderId;

    // const folder = await getFilesByFolder(folderId); // not needed here

    const file = await getFileById(fileId);

    if (!file) {
      return res.status(404).render("404");
    }

    if (file.userId !== req.user.id) {
      return res.sendStatus(403);
    }

    // I need to remove the actual stored file first. Prisma only removes the database record; it does not know about the physical file inside uploads/.

    console.log("File record:", file);
    console.log("cloudProvider:", file.cloudProvider);
    console.log("cloudKey:", file.cloudKey);
    
    if (file.cloudProvider === "local" && file.cloudKey) {
      const filePath = path.resolve(file.cloudKey);

      console.log("Deleting:", filePath);

      try {
        // await fs.unlink(file.cloudKey);
        // await fs.unlink(path.resolve(file.cloudKey));
         await fs.unlink(filePath);
        console.log("File deleted successfully");
      } catch (cleanupError) {
        console.error("Failed to delete physical file:", cleanupError);
        return next(cleanupError); // I was missing this
      }
    }

    // delete the physical file before the db row because you lose references if done the other way around.
    await deleteFile(fileId);

    res.redirect(`/app/user-folder/${folderId}`);
  } catch (err) {
    next(err);
  }
}

// CONTROLLERS: USER FOLDER EDIT PAGE (user-folder-edit.ejs)
async function getUserFolderEditPage(req, res, next) {
  try {
    const folderId = req.params.folderId;
    const userId = req.user.id;

    const folder = await getUserFolder(folderId);
   
    if (!folder) {
          return res.status(404).render("404");
        }

    if (folder.userId !== userId) {
      return res.status(403).render("forbidden");
    }

    const excludedIds = [
       folderId,
       ...(await getDescendantFolderIds(folderId)),
     ];
     
    const userFolders = await getUserFolders(userId, excludedIds);

    res.render("user-folder-edit", {
      title: "Edit Folder",
      errors: [],
      folder,
      userFolders,
      folderEmojisDropdown,
      formData: folder, 
      // csrfToken: req.csrfToken(),
    });

  } catch (err) {
    next(err);
  }
}

async function postUserFolderEditPage(req, res, next) {
  try {
    const folderId = req.params.folderId;
    const userId = req.user.id;

    const folder = await getUserFolder(folderId);

    // Check this FIRST
    if (!folder) {
      return res.status(404).render("404");
    }

    // Then ownership
    if (folder.userId !== userId) {
      return res.status(403).render("forbidden");
    }

    // NOTE - this addresses edit folder issue of nesting a folder within itself or within its children or descendants, thus preventing a circle
    // const userFolders = await getUserFolders(userId, folderId);
    const excludedIds = [folderId, ...(await getDescendantFolderIds(folderId))];

    const folders = await getUserFolders(userId, excludedIds);

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

      return res.render("user-folder-edit", {
        title: "Edit Folder",
        errors: formattedErrors,
        folder,
        userFolders,
        folderEmojisDropdown,
        formData: req.body,
        // csrfToken: req.csrfToken(),
      });
    }
    const { folder_name, folder_image, parent_folder_id, folder_description } =
      req.body;

    const updateData = {};

    if (folder_name.trim()) {
      updateData.folderName = folder_name.trim();
    }
  
    updateData.folderImage = folder_image;
  
    // Allows selecting "None"
    updateData.parentFolderId = parent_folder_id || null;

    updateData.folderDescription = folder_description || null;

    await updateFolder(folderId, updateData);

    return res.redirect(`/app/user-folder/${folderId}`);
    
  } catch (err) {
    console.error("Error during user folder update:", err);
    next(err);
  }
}

// CONTROLLERS: USER PROFILE PAGE (user-profile.ejs)
async function getUserProfilePage(req, res, next) {
  try {
    const userId = req.user.id;

    const userProfile = await getUserProfile(userId);

    if (!req.user) {
      return res.redirect("/app/log-in")
    }

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
      // csrfToken: req.csrfToken(),
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
        // csrfToken: req.csrfToken(),
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

async function deleteUserProfileByUser(req, res, next) { // This cascades to all user data
    if (!req.user) {
    return res.redirect("/app/log-in");
  }

  try {
    // Block admins from deleting their own accounts
    if (req.user.role === "ADMIN") {
      console.log("role is", req.user.role);
      
      const err = new Error("Admins cannot delete their own accounts.");
      err.status = 403;
      err.code = "ADMIN_SELF_DELETE_BLOCKED"; // FIX: structured error
      return next(err);
    }

    await deleteUser(req.user.id);
    return res.redirect("/app");
  } catch (err) {
    next(err);
  }
}

// CONTROLLERS: NEW FOLDER PAGE (new-folder.ejs)
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
    await createFolder({
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

// CONTROLLERS: NEW FILE PAGE (new-file.ejs)
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
      // csrfToken: req.csrfToken(),
    });
  } catch (err) {
    next(err);
  }
}

async function postNewFilePage(req, res, next) {
  console.log("Controller reached");
  try {
    const userId = req.user.id;
    const userFolders = await getUserFolders(userId);

    const { folder_id } = req.body;

    const errors = [];

    if (!folder_id) {
      errors.push("Please select a folder.");
    }

    if (errors.length > 0) {
      return res.status(400).render("new-file", {
        title: "Upload File",
        errors,
        userFolders,
        formData: req.body,
        // csrfToken: req.csrfToken(),
      });
    }

    await createFile({
      userId,
      folderId: folder_id, // It's uuid string and it's folder_id, not parent_folder_id
      originalFileName: req.file.originalname,
      sizeBytes: BigInt(req.file.size),
      mimeType: req.file.mimetype,
      cloudProvider: "local",
      cloudKey: req.file.path, // or req.file.filename/path if using disk storage
    });

    // 5. Redirect after success
    return res.redirect("/app/user-data");
    // } catch (err) {
    //   next(err);
    // }
  } catch (err) {
    // NOTE - Below cleans up the uploaded file if Prisma fails, as multer saves the file before my database record is created, so without this deletion I would leave orphaned files in uploads/ that are taking up storage but are not tracked in my database.
    if (req.file?.path) {
      try {
      // NOTE - reminder, this optional chaining (req.file?.path) means that req.file AND req.file.path must exist
      await fs.unlink(req.file.path);        
      } catch (cleanupError) {
        console.error("Failed to remove orphaned upload:", cleanupError);
      }
    }

    next(err);
  }
}

async function getUserFileEditPage(req,res, next) {
try {
  const fileId = req.params.fileId;
  const userId = req.user.id;

  const file = await getFileById(fileId);

  if (!file) {
    return res.status(404).render("404");
  }

  if (file.userId !== userId) {
    return res.status(403).render("forbidden");
  }

  const userFolders = await getUserFolders(userId);

  const extension = path.extname(file.originalFileName);
  const baseName = path.basename(file.originalFileName, extension);

  res.render("user-file-edit", {
    title: "Edit File",
    errors: [],
    file,
    userFolders,
    formData: {
      ...file,
      originalFileName: baseName,
    },
    extension,
    // csrfToken: req.csrfToken(),
  });

} catch (err) {
  next(err);
}
}

// async function postUserFileEditPage(req, res, next) {
//   try {
//     const fileId = req.params.fileId;
//     const userId = req.user.id;

//     const file = await getFileById(fileId);

//     // Check this FIRST
//     if (!file) {
//       return res.status(404).render("404");
//     }

//     // Then ownership
//     if (file.userId !== userId) {
//       return res.status(403).render("forbidden");
//     }

//     const userFolders = await getUserFolders(userId);
//     const folderId = file.folderId;

//     const errors = validationResult(req);

//     if (!errors.isEmpty()) {
//       const formattedErrors = [];
//       const seen = new Set();

//       errors.array().forEach((err) => {
//         if (!seen.has(err.path)) {
//           formattedErrors.push({
//             field: err.path,
//             message: err.msg,
//           });
//           seen.add(err.path); // Seen ensures only one error per field, so your EJS shows one message for password, not multiple.
//         }
//       });

//       const extension = path.extname(file.originalFileName);
//       const baseName = path.basename(file.originalFileName, extension);

//       return res.render("user-file-edit", {
//         title: "Edit File",
//         errors: formattedErrors,
//         file,
//         userFolders,
//         formData: {
//           ...file,
//           originalFileName: baseName,
//         },
//         extension,
//         // csrfToken: req.csrfToken(),
//       });
//     }
//     const { original_file_name, folder_id } =
//       req.body;

//     const updateData = {};
//     const updatedFileName = req.body.originalFileName.trim() + extension;

//     if (original_file_name) {
//       updateData.updatedFileName = original_file_name;
//     }  
//     // Allows selecting "None"
//     updateData.folderId = folder_id;

//     await updateFile(fileId, updateData);

//     return res.redirect(`/app/user-folder/${folderId}`);
    
//   } catch (err) {
//     console.error("Error during user folder update:", err);
//     next(err);
//   }
// }

async function postUserFileEditPage(req, res, next) {
  try {
    const fileId = req.params.fileId;
    const userId = req.user.id;

    const file = await getFileById(fileId);

    // File doesn't exist
    if (!file) {
      return res.status(404).render("404");
    }

    // User doesn't own this file
    if (file.userId !== userId) {
      return res.status(403).render("forbidden");
    }

    const userFolders = await getUserFolders(userId);

    // Needed for both rendering and updating
    const extension = path.extname(file.originalFileName);
    const baseName = path.basename(file.originalFileName, extension);

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

          seen.add(err.path);
        }
      });

      return res.render("user-file-edit", {
        title: "Edit File",
        errors: formattedErrors,
        file,
        userFolders,
        formData: {
          ...file,
          originalFileName: req.body.original_file_name ?? baseName,
          folderId: req.body.folder_id ?? file.folderId,
        },
        extension,
      });
    }

    const { original_file_name, folder_id } = req.body;

    // const updateData = {
    //   originalFileName: original_file_name?.trim() + extension,
    //   folderId: folder_id,
    // };

    const trimmedName = original_file_name.trim();

    const updateData = {
      originalFileName: `${trimmedName}${extension}`,
      folderId: folder_id,
    };

    await updateFile(fileId, updateData);

    return res.redirect(`/app/user-folder/${folder_id}`);
  } catch (err) {
    console.error("Error during file update:", err);
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
  getAdminEditPage,
  postAdminEditPage,
  deleteUserProfileByAdmin,
  
  getUserDataPage,
  getUserFolderPage,
 
  getUserFolderEditPage,
  postUserFolderEditPage,
  deleteUserFolderPage,

  getUserFileEditPage,
  postUserFileEditPage,
  deleteUserFile,

  getUserProfilePage,
  postUserProfilePage,
  deleteUserProfileByUser,

  getNewFolderPage,
  postNewFolderPage,
  getNewFilePage,
  postNewFilePage,
};
