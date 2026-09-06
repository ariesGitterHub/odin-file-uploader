const bcrypt = require("bcryptjs");
const fs = require("node:fs/promises");
const { ZipArchive } = require("archiver");
const path = require("node:path");
const { validationResult } = require("express-validator");
const passwordRules = require("../config/passwordRules"); // This populates the password-rules.ejs with the config/ password scheme
// const { userSizeLimitGB } = require("../config/sizeLimits"); // Changed to below
const { userSizeLimitMB } = require("../config/sizeLimits");
const { folderEmojis, folderEmojisDropdown } = require("../utils/folderEmojis");
const { formatBytes } = require("../utils/formatBytes");
const { formatExactDate } = require("../utils/formatDate");
const { formatMimeType, isPreviewableMimeType } = require("../utils/mimeUtils");
const { formatValidationErrors } = require("../utils/formatValidationErrors");

const {
  createFile,
  getFileById,
  getUserProfileStorageSize,
  updateFile,
  deleteFile,
} = require("../services/file.service");

const {
  createFolder,
  getUserFolders,
  getUserFolder,
  getUserFolderSize,
  getDescendantFolderIds,
  getFolderSubfoldersCount,
  getFolderFilesCount,
  getFilesByFolder,
  getChildFoldersById,
  getFolderTreeForArchive,
  updateFolder,
  deleteFolder,
} = require("../services/folder.service");

const {
  updateUser,
  getUserProfile,
  deleteUser,
} = require("../services/user.service");

// CONTROLLERS: NEW FOLDER PAGE (new-folder.ejs)
async function getNewFolderPage(req, res, next) {
  try {
    const userId = req.user.id;

    const userFolders = await getUserFolders(userId);

    res.render("new-folder", {
      title: "Create Folder",
      errors: [],
      folderEmojisDropdown,
      userFolders,
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

    // Extract form data
    const { folder_name, parent_folder_id, folder_image, folder_description } =
      req.body;

    // Normalize parent folder and folder description (important for NULL support)
    const normalizedParentFolderId = parent_folder_id || null;
    const normalizedFolderDescription = folder_description || null;

    // Basic validation
    const errors = [];

    if (!folder_name || folder_name.trim() === "") {
      // errors.push("Folder name is required");
      errors.push({
        field: "folder",
        message: "Folder name is required",
    })
  }

    if (errors.length > 0) {
      return res.status(400).render("new-folder", {
        title: "Create Folder",
        errors,
        userFolders,
        folderEmojisDropdown,
        formData: req.body, // REMINDER - used to keep user input
      });
    }

    // Create folder (service layer)
    await createFolder({
      userId,
      parentFolderId: normalizedParentFolderId,
      folderName: folder_name.trim(),
      folderImage: folder_image,
      folderDescription: normalizedFolderDescription,
    });

    // Redirect after success
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
      userFolders,
      formData: {}, // NOTE & REMINDER: req.body is not used in GET
      // csrfToken: req.csrfToken(), // Implementing all of these in router/appRouter.js instead as I needed a workaround for one or two routes
    });
  } catch (err) {
    next(err);
  }
}

// Helper for postNewFilePage, to avoid duplicating cleanup logic
async function removeUploadedFile(file) {
  if (!file?.path) {
    return;
  }

  try {
    await fs.unlink(file.path);
  } catch (err) {
    console.error("Failed to remove uploaded file:", err);
  }
}

async function postNewFilePage(req, res, next) {
  try {
    const userId = req.user.id;

    const userFolders = await getUserFolders(userId);

    const { folder_id } = req.body;

    const errors = [];

    if (!folder_id) {
      // errors.push("Please select a folder.");
      errors.push({
        field: "folder",
        message: "Please select a folder.",
      })
    }

    if (!req.file) {
      // errors.push("Please select a file.");
      errors.push({
        field: "file",
        message: "Please select a file.",
    })
  }

    // Re-render the form if validation fails
    if (errors.length > 0) {
      return res.status(400).render("new-file", {
        title: "Upload File",
        errors,
        userFolders,
        formData: req.body,
        csrfToken: req.csrfToken(), // Implementing all of these in router/appRouter.js instead as I needed a workaround for one or two routes
      });
    }

    // Get the user's current storage usage.
    const currentStorageUsage = await getUserProfileStorageSize(userId);
    // Get the size of the incoming file.
    const incomingFileSize = BigInt(req.file.size);
    // Convert the configured MB (formerly GB) storage limit into bytes.
    // const userMaxStorageInBytes =
    //   BigInt(userSizeLimitGB) * 
    //   1024n * 
    //   1024n * 
    //   1024n;
    const userMaxStorageInBytes =
      BigInt(userSizeLimitMB) * 
      1024n * 
      1024n;

    // if (currentStorageUsage + incomingFileSize > userMaxStorageInBytes) {
    //   await fs.unlink(req.file.path);

    // Reject the upload if it would exceed the user's storage quota.
    if (currentStorageUsage + incomingFileSize > userMaxStorageInBytes) {
      console.log("Storage limit exceeded");

      await removeUploadedFile(req.file);

      console.log("File removed successfully");

      return res.status(400).render("new-file", {
        title: "Upload File",
        // errors: ["This upload would exceed your storage limit."],
        errors: [
          {
            field: "size",
            message: "This upload would exceed your total storage limit.",
          },
        ],
        userFolders,
        formData: req.body,
        csrfToken: req.csrfToken(), // Implementing all of these in router/appRouter.js instead as I needed a workaround for one or two routes
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

    // Redirect after success
    return res.redirect("/app/user-data");
  } catch (err) {

    await removeUploadedFile(req.file);

    // Pass the ORIGINAL error to the central error middleware.
    return next(err);
  }
}

// CONTROLLER: USER DATA PAGE (user-data.ejs)
async function getUserDataPage(req, res, next) {
  try {
    const userId = req.user.id;

    const userFolders = await getUserFolders(userId);

    const rootFoldersSize = await getUserProfileStorageSize(userId);
    const formatRootFoldersSize = formatBytes(rootFoldersSize);
    // const userMaxStorageInBytes =
    //   BigInt(userSizeLimitGB) * 
    //   1024n * 
    //   1024n * 
    //   1024n;
    const userMaxStorageInBytes =
      BigInt(userSizeLimitMB) * 
      1024n * 
      1024n;
    const formatUserMaxStorage = formatBytes(userMaxStorageInBytes);
    const currentStorageUsed = (BigInt(rootFoldersSize) * 10000n) / userMaxStorageInBytes;
    const currentStoragePercentage = Number(currentStorageUsed) / 100;
    
    // Prevents folders with parentFolderIds from showing up as these should be shown in folder views.
    const rootFolders = userFolders.filter(
      (folder) => folder.parentFolderId === null,
    );

    const rootFolderCount = rootFolders.length

    const foldersWithCounts = await Promise.all(
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
      rootFolderCount, 
      userFolders: foldersWithEmoji,
      formatRootFoldersSize,
      currentStoragePercentage,
      formatUserMaxStorage,
      errors: [],
      formData: {}, // NOTE & REMINDER: req.body is not used in GET
      // csrfToken: req.csrfToken(), // Implementing all of these in router/appRouter.js instead as I needed a workaround for one or two routes
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

    // if (!folder) {
    //   return res.status(404).render("404");
    // }

    if (!folder) {
      const err = new Error("Folder not found.");
      err.status = 404;

      return next(err);
    }

    const childFolders = await getChildFoldersById(folderId);

    const foldersWithCounts = await Promise.all(
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

    const folderSize = await getUserFolderSize(folderId);
    const formatFolderSize = formatBytes(folderSize);
    const formatCreatedAtDate = formatExactDate(folder.createdAt);
    const formatUpdatedAtDate = formatExactDate(folder.updatedAt);

    const filesWithFormattedSize = folder.files
      .map((f) => ({
        ...f,
        sizeLabel: formatBytes(f.sizeBytes),
        mimeLabel: formatMimeType(f.mimeType),
        createdAtLabel: formatExactDate(f.createdAt),
        updatedAtLabel: formatExactDate(f.updatedAt),
        canPreview: isPreviewableMimeType(f.mimeType),
      }))
      .sort(
        (
          a,
          b, // Orders by alphabet where asc cannot as prisma's asc sees "T" and "t" as different
        ) =>
          a.originalFileName.localeCompare(b.originalFileName, undefined, {
            sensitivity: "base",
          }),
      );

    const folderWithEmoji = {
      ...folder,
      emoji: folderEmojis[folder.folderImage],
      files: filesWithFormattedSize,
    };

    res.render("user-folder", {
      title: folderWithEmoji.folderName,
      folder: folderWithEmoji,
      formatCreatedAtDate,
      formatUpdatedAtDate,
      formatFolderSize,
      childFolders: foldersWithEmoji,
      // csrfToken: req.csrfToken(), // Implementing all of these in router/appRouter.js instead as I needed a workaround for one or two routes
    });
  } catch (err) {
    next(err);
  }
}

async function getUserFilePreview(req, res, next) {
  try {
    const fileId = req.params.fileId;
    const userId = req.user.id;

    const file = await getFileById(fileId);

    // if (!file) {
    //   console.log("File not found:", fileId);
    //   return res.status(404).render("404");
    // }
    if (!file) {
      const err = new Error("File not found.");
      err.status = 404;

      return next(err);
    }

    if (file.userId !== userId) {
      console.log("Unauthorized user");
      return res.status(403).render("forbidden");
    }

    // Is MIME type on the viewable list?
    if (!isPreviewableMimeType(file.mimeType)) {
      console.log("Not previewable:", file.mimeType);
      // return res.status(404).render("404");
      const err = new Error("Not previewable.");
      err.status = 404;

      return next(err);
    }

    res.type(file.mimeType);
    const filePath = path.resolve(file.cloudKey);

    // Checking...
    // console.log("cloudKey:", file.cloudKey);
    // console.log("cwd:", process.cwd());
    // console.log("resolved path:", filePath);

    res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
}

async function deleteUserFolderPage(req, res, next) {
  try {
    const folderId = req.params.folderId;
    const userId = req.user.id;

    const folder = await getFilesByFolder(folderId);

    // if (!folder) {
    //   return res.status(404).render("404");
    // }

      if (!folder) {
        const err = new Error("Folder not found.");
        err.status = 404;

        return next(err);
      }

    // if (folder.userId !== req.user.id) {
    //   return res.sendStatus(403);
    // }

    if (folder.userId !== userId) {
      const err = new Error("You do not have permission to access this folder.");
      err.status = 403;

      return next(err);
    }

    await deleteFolder(folderId);

    res.redirect("/app/user-data");
  } catch (err) {
    next(err);
  }
}

async function deleteUserFile(req, res, next) {
  try {
    const { folderId, fileId } = req.params;

    const file = await getFileById(fileId);

    const userId = req.user.id;

    // if (!file) {
    //   return res.status(404).render("404");
    // }

    if (!file) {
      const err = new Error("File not found.");
      err.status = 404;

      return next(err);
    }

    // if (file.userId !== userId) {
    //   return res.sendStatus(403);
    // }

    if (file.userId !== userId) {
      const err = new Error("You do not have permission to access this file.");
      err.status = 403;

      return next(err);
    }

    // I need to remove the actual stored file first. Prisma only removes the database record; it does not know about the physical file inside uploads/.

    // console.log("File record:", file);
    // console.log("cloudProvider:", file.cloudProvider);
    // console.log("cloudKey:", file.cloudKey);

    if (file.cloudProvider === "local" && file.cloudKey) {
      const filePath = path.resolve(file.cloudKey);

      console.log("Deleting:", filePath);

      try {
        await fs.unlink(filePath);
        console.log("File deleted successfully");
      } catch (cleanupError) {
        console.error("Failed to delete physical file:", cleanupError);
        return next(cleanupError); // I was missing this
      }
    }

    // Delete the physical file before the db row because you lose references if done the other way around.
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

    // if (!folder) {
    //   return res.status(404).render("404");
    // }

    if (!folder) {
      const err = new Error("Folder not found.");
      err.status = 404;

      return next(err);
    }

    // if (folder.userId !== userId) {
    //   return res.status(403).render("forbidden");
    // }

    if (folder.userId !== userId) {
      const err = new Error(
        "You do not have permission to access this folder.",
      );
      err.status = 403;

      return next(err);
    }

    const excludedIds = [folderId, ...(await getDescendantFolderIds(folderId))];

    const userFolders = await getUserFolders(userId, excludedIds);

    res.render("user-folder-edit", {
      title: "Edit Folder",
      errors: [],
      folder,
      userFolders,
      folderEmojisDropdown,
      formData: folder,
      // csrfToken: req.csrfToken(), // Implementing all of these in router/appRouter.js instead as I needed a workaround for one or two routes
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

    // if (!folder) {
    //   return res.status(404).render("404");
    // }

    if (!folder) {
      const err = new Error("Folder not found.");
      err.status = 404;

      return next(err);
    }

    // if (folder.userId !== userId) {
    //   return res.status(403).render("forbidden");
    // }

    if (folder.userId !== userId) {
      const err = new Error(
        "You do not have permission to access this folder.",
      );
      err.status = 403;

      return next(err);
    }

    // NOTE - this addresses edit folder issue of nesting a folder within itself or within its children or descendants, thus preventing a circle
    const excludedIds = [folderId, ...(await getDescendantFolderIds(folderId))];

    const folders = await getUserFolders(userId, excludedIds);

    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
      const errors = formatValidationErrors(validationErrors);

      return res.render("user-folder-edit", {
        title: "Edit Folder",
        errors,
        folder,
        userFolders,
        folderEmojisDropdown,
        formData: req.body,
        // csrfToken: req.csrfToken(), // Implementing all of these in router/appRouter.js instead as I needed a workaround for one or two routes
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

// CONTROLLERS: USER FILE EDIT PAGE (user-file-edit.ejs)

async function getUserFileEditPage(req, res, next) {
  try {
    const fileId = req.params.fileId;
    const userId = req.user.id;

    const file = await getFileById(fileId);

    // if (!file) {
    //   return res.status(404).render("404");
    // }

    if (!file) {
      const err = new Error("File not found.");
      err.status = 404;

      return next(err);
    }

    // if (file.userId !== userId) {
    //   return res.status(403).render("forbidden");
    // }

    if (file.userId !== userId) {
      const err = new Error("You do not have permission to access this file.");
      err.status = 403;

      return next(err);
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
      // csrfToken: req.csrfToken(), // Implementing all of these in router/appRouter.js instead as I needed a workaround for one or two routes
    });
  } catch (err) {
    next(err);
  }
}

async function postUserFileEditPage(req, res, next) {
  try {
    const fileId = req.params.fileId;
    const userId = req.user.id;

    const file = await getFileById(fileId);

    // if (!file) {
    //   return res.status(404).render("404");
    // }

    if (!file) {
      const err = new Error("File not found.");
      err.status = 404;

      return next(err);
    }

    // if (file.userId !== userId) {
    //   return res.status(403).render("forbidden");
    // }

    if (file.userId !== userId) {
      const err = new Error("You do not have permission to access this file.");
      err.status = 403;

      return next(err);
    }

    const userFolders = await getUserFolders(userId);

    // Needed for both rendering and updating
    const extension = path.extname(file.originalFileName);
    const baseName = path.basename(file.originalFileName, extension);

    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
      const errors = formatValidationErrors(validationErrors);

      return res.render("user-file-edit", {
        title: "Edit File",
        errors,
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

// CONTROLLERS: USER PROFILE PAGE (user-profile.ejs)
async function getUserProfilePage(req, res, next) {
  try {
    if (!req.user) {
      return res.redirect("/app/log-in");
    }

    const userId = req.user.id;

    const userProfile = await getUserProfile(userId);

    // if (!req.user) {
    //   return res.redirect("/app/log-in");
    // }

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
      // csrfToken: req.csrfToken(), // Implementing all of these in router/appRouter.js instead as I needed a workaround for one or two routes
    });
  } catch (err) {
    next(err);
  }
}

async function postUserProfilePage(req, res, next) {
  try {
    const userId = req.user.id;
    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
      const errors = formatValidationErrors(validationErrors);

      return res.render("user-profile", {
        title: "Change Your Profile",
        errors,
        formData: req.body || {},
        passwordRules,
        // csrfToken: req.csrfToken(), // Implementing all of these in router/appRouter.js instead as I needed a workaround for one or two routes
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

    await updateUser(userId, updateData);

    return res.redirect("/app/user-data");
  } catch (err) {
    console.error("Error during user profile update:", err);
    next(err);
  }
}

async function deleteUserProfileByUser(req, res, next) {
  // REMINDER - this cascades to all user data
  if (!req.user) {
    return res.redirect("/app/log-in");
  }

  try {
    const userId = req.user.id;
    // Block admins from deleting their own accounts
    if (req.user.role === "ADMIN") {
      const err = new Error("Admins cannot delete their own accounts.");
      err.status = 403;
      err.code = "ADMIN_SELF_DELETE_BLOCKED"; // FIX: structured error
      return next(err);
    }

    await deleteUser(userId);
    return res.redirect("/app");
  } catch (err) {
    next(err);
  }
}

// CONTROLLERS: DOWNLOAD FOLDER OR FILE
async function downloadFolder(req, res, next) {
  try {
    const folderId = req.params.folderId;
    const userId = req.user.id;

    const folder = await getUserFolder(folderId);

    // if (!folder) {
    //   return res.status(404).render("404");
    // }

    if (!folder) {
      const err = new Error("Folder not found.");
      err.status = 404;

      return next(err);
    }

    // if (folder.userId !== userId) {
    //   return res.status(403).render("forbidden");
    // }

    if (folder.userId !== userId) {
      const err = new Error(
        "You do not have permission to access this folder.",
      );
      err.status = 403;

      return next(err);
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

    await archive.finalize();
  } catch (err) {
    console.error("Error during folder download:", err);
    next(err);
  }
}

async function downloadFile(req, res, next) {
  try {
    const fileId = req.params.fileId;
    const userId = req.user.id;

    const file = await getFileById(fileId);

    // if (!file) {
    //   return res.status(404).render("404");
    // }

    if (!file) {
      const err = new Error("File not found.");
      err.status = 404;

      return next(err);
    }

    // if (file.userId !== userId) {
    //   return res.status(403).render("forbidden");
    // }
    
    if (file.userId !== userId) {
      const err = new Error("You do not have permission to access this file.");
      err.status = 403;

      return next(err);
    }

    // Resolve the stored path (e.g. "uploads/1785174742641-TEST.docx")
    const filePath = path.resolve(file.cloudKey);

    // Ensure the file still exists on disk
    try {
      await fs.access(filePath);
    } catch {
      // return res.status(404).render("404");
      const err = new Error("File path not found.");
      err.status = 404;

      return next(err);
    }

    // Download using the original filename stored in the database
    res.download(filePath, file.originalFileName, (err) => {
      if (err) {
        console.error("Download error:", err);

        // If Express hasn't already started sending the response, let your error middleware handle it.
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

module.exports = {
  getNewFolderPage,
  postNewFolderPage,
  getNewFilePage,
  postNewFilePage,
  getUserDataPage,
  getUserFolderPage,
  getUserFilePreview,
  deleteUserFolderPage,
  deleteUserFile,
  getUserFolderEditPage,
  postUserFolderEditPage,
  getUserFileEditPage,
  postUserFileEditPage,
  getUserProfilePage,
  postUserProfilePage,
  deleteUserProfileByUser,
  downloadFolder,
  downloadFile,
};
