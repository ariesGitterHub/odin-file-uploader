// const bcrypt = require("bcryptjs");
// const fs = require("node:fs/promises");
// const { ZipArchive } = require("archiver");
// const path = require("node:path");
// const passport = require("passport");
// const { validationResult } = require("express-validator");
// const passwordRules = require("../config/passwordRules"); // This populates the password-rules.ejs with the current password scheme
const { 
  folderEmojis,
  // folderEmojisDropdown
 } = require("../utils/folderEmojis");

// const { formatBytes } = require("../utils/formatBytes");

const { 
  // formatRelativeDate, 
  formatExactDate 
} = require("../utils/formatDate");

// const { formatMimeType, isPreviewableMimeType } = require("../utils/mimeUtils");
const { parseLocalDateTimeToUTC } = require("../utils/timezoneUtils");

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
  // getUserFolderSize,
  // getDescendantFolderIds,
  // getFolderSubfoldersCount,
  // getFolderFilesCount,
  // getFilesByFolder,
  // getChildFoldersById,
  // getFolderTreeForArchive,
  // updateFolder,
  // deleteFolder,
} = require("../services/folder.service");

const {
  createFolderShareLink,
  createFileShareLink,
  getShareLinkById,
  getShareHistoryByFolderId,
  getShareHistoryByFileId,
  getUserShareLinksByUserId,
  // getUserShareLinksByFolderId,
  // getUserShareLinksByFileId,
  // getShareLinkByToken,
  // updateLastAccessedAt,
  // updateDownloadCount,
  toggleShareLinkActiveStatus,
  deleteShare,
} = require("../services/share.service");

// const {
//   createUser,
//   updateUser,
//   getUserProfile,
//   deleteUser,
// } = require("../services/user.service");

// CONTROLLER SHARE LINK PAGE (share-link.ejs) THAT CAN BE FOR A FOLDER OR A FILE

async function getUserShareLinkFolderPage(req, res, next) {
  try {
    const folderId = req.params.folderId;
    const userId = req.user.id;
    const shareLinkId = req.query.shareLinkId;

    const folder = await getFolderById(folderId);

    if (!folder) {
      return res.status(404).render("404");
    }

    if (folder.userId !== userId) {
      console.log("Unauthorized user");
      return res.status(403).render("forbidden");
    }

    const folderWithEmoji = {
      ...folder,
      emoji: folderEmojis[folder.folderImage],
    };

    const shareHistoryByFolder = await getShareHistoryByFolderId(
      folderId,
      userId,
    );

    const formattedDates = shareHistoryByFolder.map((f) => ({
      ...f,
      createdAtLabel: formatExactDate(f.createdAt), // formats file dates
      updatedAtLabel: formatExactDate(f.updatedAt), // formats file dates
      expiresAtLabel: formatExactDate(f.expiresAt), // formats shareLink dates
      lastAccessedAtLabel: formatExactDate(f.lastAccessedAt), // formats file dates
    }));

    let shareLink = null;
    let shareUrl = null;

    // Only retrieve a newly-created link when the redirect supplied
    // a shareLinkId.
    if (shareLinkId) {
      shareLink = await getShareLinkById(shareLinkId); // Bubba

      // Make sure the link actually belongs to this file and user.
      if (
        !shareLink ||
        shareLink.folderId !== folderId ||
        shareLink.userId !== userId
      ) {
        shareLink = null;
      } else {
        shareUrl = `${req.protocol}://${req.get("host")}/app/share-page/${shareLink.token}`;
      }
    }

    console.log("shareLink is", shareLink);

    res.render("share-link", {
      title: "Share Folder",
      itemType: "folder",
      // folder,
      folder: folderWithEmoji,
      shareHistoryByFolder: formattedDates,
      errors: [],
      formData: {}, // NOTE & REMINDER: req.body is not used in GET
      // csrfToken: req.csrfToken(),
      // shareLink: null,
      // shareUrl: null,
      // shareLinkId,
      shareLink,
      shareUrl,
    });
  } catch (err) {
    next(err);
  }
}

async function postUserShareLinkFolderPage(req, res, next) {
  try {
    // Identify the folder being shared from the URL and the authenticated user.
    // Do not accept either value from req.body because they should come from
    // trusted request context rather than user-editable form data.
    const folderId = req.params.folderId;
    const userId = req.user.id;

    // Retrieve the folder so we can verify that it exists and belongs to
    // the authenticated user before creating a share link for it.
    const folder = await getFolderById(folderId);

    if (!folder) {
      return res.status(404).render("404");
    }

    // A user must own the folder before they can create a share link for it.
    if (folder.userId !== userId) {
      return res.status(403).render("forbidden");
    }
// TODO - is below NEEDED?
    // const shareHistoryByFolder = await getShareHistoryByFolderId(folderId);

    // const formattedDates = shareHistoryByFolder.map((f) => ({
    //   ...f,
    //   createdAtLabel: formatExactDate(f.createdAt), // formats file dates
    //   updatedAtLabel: formatExactDate(f.updatedAt), // formats file dates
    //   expiresAtLabel: formatExactDate(f.expiresAt), // formats shareLink dates
    //   lastAccessedAtLabel: formatExactDate(f.lastAccessedAt), // formats file dates
    // }));

    const { expires_at, custom_expires_at, max_downloads, timezone } = req.body;

    // null represents an expiration of "never".
    let expiresAt = null;

    // Convert the expiration preset selected in the form into an actual
    // Date value that Prisma can store.
    if (expires_at === "1-day") {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 1);
    } else if (expires_at === "7-days") {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
    } else if (expires_at === "30-days") {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
    } else if (expires_at === "custom") {
      // Convert the datetime-local form value into a JavaScript Date,
      // interpreting the selected time in the user's browser timezone.
      expiresAt = parseLocalDateTimeToUTC(custom_expires_at, timezone);

      // A custom expiration must produce a valid Date.
      if (!expiresAt) {
        return res.status(400).render("share-link", {
          title: "Share Folder",
          itemType: "folder",
          folder: {
            ...folder,
            emoji: folderEmojis[folder.folderImage],
          },
          // shareHistoryByFolder: formattedDates,
          errors: ["Please provide a valid expiration date and time."],
          formData: req.body,
          shareLink: null,
          shareUrl: null,
          csrfToken: req.csrfToken(),
        });
      }
    } else if (expires_at === "never") {
      // Keep expiresAt as null for links that never expire.
      expiresAt = null;
    } else {
      // Reject unexpected expiration values rather than creating a share
      // link with an invalid or unintended expiration.
      return res.status(400).render("share-link", {
        title: "Share Folder",
        itemType: "folder",
        folder: {
          ...folder,
          emoji: folderEmojis[folder.folderImage],
        },
        // shareHistoryByFolder: formattedDates,
        errors: ["Please select a valid expiration."],
        formData: req.body,
        shareLink: null,
        shareUrl: null,
        csrfToken: req.csrfToken(),
      });
    }

    // An expiration date must be in the future.
    // "never" is represented by null and is intentionally allowed.
    if (expiresAt !== null && expiresAt <= new Date()) {
      return res.status(400).render("share-link", {
        title: "Share Folder",
        itemType: "folder",
        folder: {
          ...folder,
          emoji: folderEmojis[folder.folderImage],
        },
        // shareHistoryByFolder: formattedDates,
        errors: ["Expiration date must be in the future."],
        formData: req.body,
        shareLink: null,
        shareUrl: null,
        csrfToken: req.csrfToken(),
      });
    }

    // An empty download limit means unlimited downloads, represented by null
    // in the database. Otherwise, convert the form's string value to an integer.
    const maxDownloads =
      max_downloads === "" ? null : Number.parseInt(max_downloads, 10);

    // When a limit is supplied, it must be a positive integer.
    if (
      maxDownloads !== null &&
      (!Number.isInteger(maxDownloads) || maxDownloads < 1)
    ) {
      return res.status(400).render("share-link", {
        title: "Share Folder",
        itemType: "folder",
        folder: {
          ...folder,
          emoji: folderEmojis[folder.folderImage],
        },
        // shareHistoryByFolder: formattedDates,
        errors: ["Maximum downloads must be at least 1."],
        formData: req.body,
        shareLink: null,
        shareUrl: null,
        csrfToken: req.csrfToken(),
      });
    }

    // Create the share link using only the values established and validated
    // by this controller. The service generates the random token and creates
    // the ShareLink database record.
    const shareLink = await createFolderShareLink({
      userId,
      folderId,
      permission: "VIEW",
      maxDownloads,
      expiresAt,
    });

    // The token is stored in the database, while the complete URL is
    // constructed when it is needed.
    // const shareUrl = `${req.protocol}://${req.get("host")}/app/share-page/${shareLink.token}`;

    // Render the share page again so the newly generated link can be shown
    // to the user immediately.
    // return res.render("share-link", { // BUBBA
    // return res.render("share-link", {
    //   title: "Share Folder",
    //   itemType: "folder",
    //   folder: {
    //     ...folder,
    //     emoji: folderEmojis[folder.folderImage],
    //   },
    //   shareHistoryByFolder: formattedDates,
    //   errors: [],
    //   formData: req.body,
    //   shareLink,
    //   shareUrl,
    //   csrfToken: req.csrfToken(),
    // });

    return res.redirect(
      `/app/share-folder/${folderId}?shareLinkId=${shareLink.id}`,
    );
  } catch (err) {
    next(err);
  }
}

async function getUserShareLinkFilePage(req, res, next) {
  try {
    const fileId = req.params.fileId;
    const userId = req.user.id;
    const shareLinkId = req.query.shareLinkId;  

    const file = await getFileById(fileId);

    if (!file) {
      return res.status(404).render("404");
    }

    if (file.userId !== userId) {
      // console.log("Unauthorized user");
      return res.status(403).render("forbidden");
    }

    const shareHistoryByFile = await getShareHistoryByFileId(
      fileId,
      userId,
    );

    const formattedDates = shareHistoryByFile.map((f) => ({
      ...f,
      createdAtLabel: formatExactDate(f.createdAt), // formats file dates
      updatedAtLabel: formatExactDate(f.updatedAt), // formats file dates
      expiresAtLabel: formatExactDate(f.expiresAt), // formats shareLink dates
      lastAccessedAtLabel: formatExactDate(f.lastAccessedAt), // formats file dates
    }));

    let shareLink = null;
    let shareUrl = null;

    // Only retrieve a newly-created link when the redirect supplied
    // a shareLinkId.
    if (shareLinkId) {
      shareLink = await getShareLinkById(shareLinkId);

      // Make sure the link actually belongs to this file and user.
      if (
        !shareLink ||
        shareLink.fileId !== fileId ||
        shareLink.userId !== userId
      ) {
        shareLink = null;
      } else {
        shareUrl = `${req.protocol}://${req.get("host")}/app/share-page/${shareLink.token}`;
      }
    }

     console.log("shareLink is", shareLink);
     console.log("shareUrl is....", shareUrl);

    // res.render("share-link", {
     return res.render("share-link", { //BUBBA
      title: "Share File",
      itemType: "file",
      file,
      shareHistoryByFile: formattedDates,
      errors: [],
      formData: {}, // NOTE & REMINDER: req.body is not used in GET
      // csrfToken: req.csrfToken(),
      shareLink,
      shareUrl,
    });
  } catch (err) {
    next(err);
  }
}

async function postUserShareLinkFilePage(req, res, next) {
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


    // TODO - is below NEEDED???
    // const shareHistoryByFile = await getShareHistoryByFileId(fileId, userId);

    // const formattedDates = shareHistoryByFile.map((f) => ({
    //   ...f,
    //   createdAtLabel: formatExactDate(f.createdAt), // formats file dates
    //   updatedAtLabel: formatExactDate(f.updatedAt), // formats file dates
    //   expiresAtLabel: formatExactDate(f.expiresAt), // formats shareLink dates
    //   lastAccessedAtLabel: formatExactDate(f.lastAccessedAt), // formats file dates
    // }));

    const { expires_at, custom_expires_at, max_downloads, timezone } = req.body;

    // null represents an expiration of "never".
    let expiresAt = null;

    // Convert the expiration preset selected in the form into an actual
    // Date value that Prisma can store.
    if (expires_at === "1-day") {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 1);
    } else if (expires_at === "7-days") {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
    } else if (expires_at === "30-days") {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
    } else if (expires_at === "custom") {
      // Convert the datetime-local form value into a JavaScript Date,
      // interpreting the selected time in the user's browser timezone.
      expiresAt = parseLocalDateTimeToUTC(custom_expires_at, timezone);

      // A custom expiration must produce a valid Date.
      if (!expiresAt) {
        return res.status(400).render("share-link", {
          title: "Share File",
          itemType: "file",
          errors: ["Please provide a valid expiration date and time."],
          formData: req.body,
          shareLink: null,
          shareUrl: null,
          csrfToken: req.csrfToken(),
        });
      }
    } else if (expires_at === "never") {
      // Keep expiresAt as null for links that never expire.
      expiresAt = null;
    } else {
      // Reject unexpected expiration values rather than creating a share
      // link with an invalid or unintended expiration.
      return res.status(400).render("share-link", {
        title: "Share File",
        itemType: "file",
        file, // ??? was this the issue with my error?
        // shareHistoryByFile: formattedDates,
        errors: ["Please select a valid expiration."],
        formData: req.body,
        shareLink: null,
        shareUrl: null,
        csrfToken: req.csrfToken(),
      });
    }

    // An expiration date must be in the future.
    // "never" is represented by null and is intentionally allowed.
    if (expiresAt !== null && expiresAt <= new Date()) {
      return res.status(400).render("share-link", {
        title: "Share File",
        itemType: "file",
        file, // ??? was this the issue with my error?
        // shareHistoryByFile: formattedDates,
        errors: ["Expiration date must be in the future."],
        formData: req.body,
        shareLink: null,
        shareUrl: null,
        csrfToken: req.csrfToken(),
      });
    }

    // An empty download limit means unlimited downloads, represented by null
    // in the database. Otherwise, convert the form's string value to an integer.
    const maxDownloads =
      max_downloads === "" ? null : Number.parseInt(max_downloads, 10);

    // When a limit is supplied, it must be a positive integer.
    if (
      maxDownloads !== null &&
      (!Number.isInteger(maxDownloads) || maxDownloads < 1)
    ) {
      return res.status(400).render("share-link", {
        title: "Share File",
        itemType: "file",
        file, // ??? was this the issue with my error?
        // shareHistoryByFile: formattedDates,
        errors: ["Maximum downloads must be at least 1."],
        formData: req.body,
        shareLink: null,
        shareUrl: null,
        csrfToken: req.csrfToken(),
      });
    }

    // Create the share link using only the values established and validated
    // by this controller. The service generates the random token and creates
    // the ShareLink database record.
    const shareLink = await createFileShareLink({
      userId,
      fileId,
      permission: "VIEW",
      maxDownloads,
      expiresAt,
    });

    // The token is stored in the database, while the complete URL is
    // constructed when it is needed.
    // const shareUrl = `${req.protocol}://${req.get("host")}/app/share-page/${shareLink.token}`;

    // Render the share page again so the newly generated link can be shown
    // to the user immediately.
    // return res.render("share-link", {
    //   title: "Share File",
    //   itemType: "file",
    //   file, // ??? was this the issue with my error?
    //   shareHistoryByFile: formattedDates,
    //   errors: [],
    //   formData: req.body,
    //   shareLink,
    //   shareUrl,
    //   csrfToken: req.csrfToken(),
    // });

    // Redirect to the GET page after successfully creating the link.
    // Pass the new share-link ID so the GET controller knows which link
    // should be displayed.
    return res.redirect(
      `/app/share-file/${fileId}?shareLinkId=${shareLink.id}`,
    );
  } catch (err) {
    next(err);
  }
}

// CONTROLLER SHARE OVERVIEW PAGE (share-overview.ejs) SHOWING ALL USER SHARES

async function getUserShareOverviewPage(req, res, next) {
  try {
    const userId = req.user.id;

    const shareLinks = await getUserShareLinksByUserId(userId);
    // const shareUrl = `${req.protocol}://${req.get("host")}/share/${shareLink.token}`;
    const shareUrl = `${req.protocol}://${req.get("host")}/app/share-page/`;
    // const folderId = shareLinks.folderId;
  
    // const formatCreatedAtDate = formatExactDate(shareLinks.createdAt); 
    // const formatUpdatedAtDate = formatExactDate(shareLinks.updatedAt); 
    // const formatExpiresAtDate = formatExactDate(shareLinks.expiresAt); 

    const formattedShareLinks = shareLinks.map((f) => ({
      ...f,
      // sizeLabel: formatBytes(f.sizeBytes),
      // mimeLabel: formatMimeType(f.mimeType),
      createdAtLabel: formatExactDate(f.createdAt), // formats shareLink dates
      updatedAtLabel: formatExactDate(f.updatedAt), // formats shareLink dates
      expiresAtLabel: formatExactDate(f.expiresAt), // formats shareLink dates
      lastAccessedAtLabel: formatExactDate(f.lastAccessedAt), // formats shareLink dates
      // canPreview: isPreviewableMimeType(f.mimeType),
    }));

    res.render("share-overview", {
      title: "Share Overview",
      errors: [],
      formData: {}, // NOTE & REMINDER: req.body is not used in GET
      // csrfToken: req.csrfToken(),
      shareLinks: formattedShareLinks,
      // formatCreatedAtDate,
      // formatUpdatedAtDate,
      // formatExpiresAtDate,
      shareUrl,
    });
  } catch (err) {
    next (err)
  }
}

async function postUserShareLinkIsActiveUpdate(req, res, next) {
  try {
    const shareLinkId = req.params.shareLinkId;
    const userId = req.user.id;

    // Retrieve the share link so we can verify that it exists
    // and belongs to the authenticated user.
    const shareLink = await getShareLinkById(shareLinkId);

    if (!shareLink) {
      return res.status(404).render("404");
    }

    if (shareLink.userId !== userId) {
      return res.sendStatus(403);
    }

    // Toggle the current database value.
    await toggleShareLinkActiveStatus(shareLinkId, {
      isActive: !shareLink.isActive,
    });

    return res.redirect("/app/share-overview");
  } catch (err) {
    next(err);
  }
}

async function deleteUserShare(req, res, next) {
  try {
    const shareLinkId = req.params.shareLinkId;

    const shareLink = await getShareLinkById(shareLinkId);

    const userId = req.user.id;

    if (!shareLink) {
      return res.status(404).render("404");
    }

    if (shareLink.userId !== userId) {
      return res.sendStatus(403);
    }

    await deleteShare(shareLinkId);

    res.redirect("/app/share-overview");    
  } catch (err) {
    next(err)
  }
}


module.exports = {
  getUserShareLinkFolderPage,
  postUserShareLinkFolderPage,
  getUserShareLinkFilePage,
  postUserShareLinkFilePage,
  getUserShareOverviewPage,
  postUserShareLinkIsActiveUpdate,
  deleteUserShare,
};