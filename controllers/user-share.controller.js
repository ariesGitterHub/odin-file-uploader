const { folderEmojis } = require("../utils/folderEmojis");
const { formatExactDate } = require("../utils/formatDate");
const { parseLocalDateTimeToUTC } = require("../utils/timezoneUtils");
const { getFileById } = require("../services/file.service");

const { getFolderById } = require("../services/folder.service");
const {
  createFolderShareLink,
  createFileShareLink,
  getShareLinkById,
  getShareHistoryByFolderId,
  getShareHistoryByFileId,
  getUserShareLinksByUserId,
  toggleShareLinkActiveStatus,
  deleteShare,
} = require("../services/share.service");

// CONTROLLER SHARE LINK PAGE (share-link.ejs) THAT CAN BE FOR A FOLDER OR A FILE
async function getUserShareLinkFolderPage(req, res, next) {
  try {
    const folderId = req.params.folderId;
    const userId = req.user.id;
    const shareLinkId = req.query.shareLinkId;

    const folder = await getFolderById(folderId);

    if (!folder) {
      // return res.status(404).render("404");
      const err = new Error("Folder not found.");
      err.status = 404;

      return next(err);
    }

    if (folder.userId !== userId) {
      console.log("Unauthorized user");
      // return res.status(403).render("forbidden");
      const err = new Error(
        "You do not have permission to access this folder.",
      );
      err.status = 403;

      return next(err);
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
      createdAtLabel: formatExactDate(f.createdAt),
      updatedAtLabel: formatExactDate(f.updatedAt),
      expiresAtLabel: formatExactDate(f.expiresAt),
      lastAccessedAtLabel: formatExactDate(f.lastAccessedAt),
    }));

    let shareLink = null;
    let shareUrl = null;

    // Only retrieve a newly-created link when the redirect supplied a shareLinkId.
    if (shareLinkId) {
      shareLink = await getShareLinkById(shareLinkId);

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

    return res.render("share-link", {
      title: "Share Folder",
      itemType: "folder",
      folder: folderWithEmoji,
      shareHistoryByFolder: formattedDates,
      errors: [],
      formData: {}, // NOTE & REMINDER: req.body is not used in GET
      // csrfToken: req.csrfToken(), // Implementing all of these in router/appRouter.js instead as I needed a workaround for one or two routes
      shareLink,
      shareUrl,
    });
  } catch (err) {
    next(err);
  }
}

async function postUserShareLinkFolderPage(req, res, next) {
  try {
    // Identify the folder being shared from the URL and the authenticated user; Do not accept either value from req.body because they should come from trusted request context rather than user-editable form data.
    const folderId = req.params.folderId;
    const userId = req.user.id;

    // Retrieve the folder so we can verify that it exists and belongs to the authenticated user before creating a share link for it.
    const folder = await getFolderById(folderId);

    if (!folder) {
      // return res.status(404).render("404");
      const err = new Error("Folder not found.");
      err.status = 404;

      return next(err);
    }

    // A user must own the folder before they can create a share link for it.
    if (folder.userId !== userId) {
      // return res.status(403).render("forbidden");
      const err = new Error(
        "You do not have permission to access this folder.",
      );
      err.status = 403;

      return next(err);
    }

    const shareHistoryByFolder = await getShareHistoryByFolderId(
      folderId,
      userId,
    );

    const formattedDates = shareHistoryByFolder.map((f) => ({
      ...f,
      createdAtLabel: formatExactDate(f.createdAt),
      updatedAtLabel: formatExactDate(f.updatedAt),
      expiresAtLabel: formatExactDate(f.expiresAt),
      lastAccessedAtLabel: formatExactDate(f.lastAccessedAt),
    }));

    const { expires_at, custom_expires_at, max_downloads, timezone } = req.body;

    // NOTE - null represents an expiration of "never".
    let expiresAt = null;

    // Convert the expiration preset selected in the form into an actual Date() value that Prisma can store.
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
      // Convert the datetime-local form value into a JavaScript Date, interpreting the selected time in the user's browser timezone.
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
          shareHistoryByFolder: formattedDates,
          // errors: ["Please provide a valid expiration date and time."],
          errors: [
            {
              field: "expires_at_with_time",
              message: "Please provide a valid expiration date and time.",
            },
          ],
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
      // Reject unexpected expiration values rather than creating a share link with an invalid or unintended expiration.
      return res.status(400).render("share-link", {
        title: "Share Folder",
        itemType: "folder",
        folder: {
          ...folder,
          emoji: folderEmojis[folder.folderImage],
        },
        shareHistoryByFolder: formattedDates,
        // errors: ["Please select a valid expiration."],
        errors: [
          {
            field: "expires_at",
            message: "Please provide a valid expiration date.",
          },
        ],
        formData: req.body,
        shareLink: null,
        shareUrl: null,
        csrfToken: req.csrfToken(),
      });
    }

    // An expiration date must be in the future; "never" is represented by null and is intentionally allowed.
    if (expiresAt !== null && expiresAt <= new Date()) {
      return res.status(400).render("share-link", {
        title: "Share Folder",
        itemType: "folder",
        folder: {
          ...folder,
          emoji: folderEmojis[folder.folderImage],
        },
        shareHistoryByFolder: formattedDates,
        // errors: ["Expiration date must be in the future."],
        errors: [
          {
            field: "no_past_expires_at",
            message: "Expiration date must be in the future.",
          },
        ],
        formData: req.body,
        shareLink: null,
        shareUrl: null,
        csrfToken: req.csrfToken(),
      });
    }

    // An empty download limit means unlimited downloads, represented by null in the database. Otherwise, convert the form's string value to an integer
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
        shareHistoryByFolder: formattedDates,
        // errors: ["Maximum downloads must be at least 1."],
        errors: [
          {
            field: "max_downloads",
            message: "Maximum downloads must be at least 1.",
          },
        ],
        formData: req.body,
        shareLink: null,
        shareUrl: null,
        csrfToken: req.csrfToken(),
      });
    }

    // Create the share link using only the values established and validated by this controller; The service generates the random token and creates the ShareLink database record
    const shareLink = await createFolderShareLink({
      userId,
      folderId,
      maxDownloads,
      expiresAt,
    });

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
      // return res.status(404).render("404");
      const err = new Error("File not found.");
      err.status = 404;

      return next(err);
    }

    if (file.userId !== userId) {
      // return res.status(403).render("forbidden");
      const err = new Error(
        "You do not have permission to access this file.",
      );
      err.status = 403;

      return next(err);
    }

    const shareHistoryByFile = await getShareHistoryByFileId(fileId, userId);

    const formattedDates = shareHistoryByFile.map((f) => ({
      ...f,
      createdAtLabel: formatExactDate(f.createdAt),
      updatedAtLabel: formatExactDate(f.updatedAt),
      expiresAtLabel: formatExactDate(f.expiresAt),
      lastAccessedAtLabel: formatExactDate(f.lastAccessedAt),
    }));

    let shareLink = null;
    let shareUrl = null;

    // Only retrieve a newly-created link when the redirect supplied a shareLinkId.
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

    return res.render("share-link", {
      title: "Share File",
      itemType: "file",
      file,
      shareHistoryByFile: formattedDates,
      errors: [],
      formData: {}, // NOTE & REMINDER: req.body is not used in GET
      // csrfToken: req.csrfToken(), // Implementing all of these in router/appRouter.js instead as I needed a workaround for one or two routes
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
      // return res.status(404).render("404");
      const err = new Error("File not found.");
      err.status = 404;

      return next(err);
    }

    if (file.userId !== userId) {
      // return res.status(403).render("forbidden");
      const err = new Error(
        "You do not have permission to access this file.",
      );
      err.status = 403;

      return next(err);
    }

    const shareHistoryByFile = await getShareHistoryByFileId(fileId, userId);

    const formattedDates = shareHistoryByFile.map((f) => ({
      ...f,
      createdAtLabel: formatExactDate(f.createdAt),
      updatedAtLabel: formatExactDate(f.updatedAt),
      expiresAtLabel: formatExactDate(f.expiresAt),
      lastAccessedAtLabel: formatExactDate(f.lastAccessedAt),
    }));

    const { expires_at, custom_expires_at, max_downloads, timezone } = req.body;

    // NOTE - null represents an expiration of "never".
    let expiresAt = null;

    // Convert the expiration preset selected in the form into an actual Date value that Prisma can store.
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
      // Convert the datetime-local form value into a JavaScript Date, interpreting the selected time in the user's browser timezone.
      expiresAt = parseLocalDateTimeToUTC(custom_expires_at, timezone);

      // A custom expiration must produce a valid Date
      if (!expiresAt) {
        return res.status(400).render("share-link", {
          title: "Share File",
          itemType: "file",
          // errors: ["Please provide a valid expiration date and time."],
          errors: [
            {
              field: "expires_at_with_time",
              message: "Please provide a valid expiration date and time.",
            },
          ],
          shareHistoryByFile: formattedDates,
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
      // Reject unexpected expiration values rather than creating a share link with an invalid or unintended expiration.
      return res.status(400).render("share-link", {
        title: "Share File",
        itemType: "file",
        file,
        // errors: ["Please select a valid expiration."],
        errors: [
          {
            field: "expires_at",
            message: "Please select a valid expiration.",
          },
        ],
        shareHistoryByFile: formattedDates,
        formData: req.body,
        shareLink: null,
        shareUrl: null,
        csrfToken: req.csrfToken(),
      });
    }

    // An expiration date must be in the future; "never" is represented by null and is intentionally allowed.
    if (expiresAt !== null && expiresAt <= new Date()) {
      return res.status(400).render("share-link", {
        title: "Share File",
        itemType: "file",
        file,
        // errors: ["Expiration date must be in the future."],
        errors: [
          {
            field: "no_past_expires_at",
            message: "Expiration date must be in the future.",
          },
        ],
        shareHistoryByFile: formattedDates,
        formData: req.body,
        shareLink: null,
        shareUrl: null,
        csrfToken: req.csrfToken(),
      });
    }

    // An empty download limit means unlimited downloads, represented by null in the database. Otherwise, convert the form's string value to an integer.
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
        file,
        shareHistoryByFile: formattedDates,
        // errors: ["Maximum downloads must be at least 1."],
        errors: [
          {
            field: "max_downloads",
            message: "Maximum downloads must be at least 1",
          },
        ],
        formData: req.body,
        shareLink: null,
        shareUrl: null,
        csrfToken: req.csrfToken(),
      });
    }

    // Create the share link using only the values established and validated by this controller. The service generates the random token and creates the ShareLink database record.
    const shareLink = await createFileShareLink({
      userId,
      fileId,
      maxDownloads,
      expiresAt,
    });

    // Redirect to the GET page after successfully creating the link. Pass the new share-link ID so the GET controller knows which link should be displayed.
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

    const shareUrl = `${req.protocol}://${req.get("host")}/app/share-page/`;

    const formattedShareLinks = shareLinks.map((f) => ({
      ...f,
      createdAtLabel: formatExactDate(f.createdAt),
      updatedAtLabel: formatExactDate(f.updatedAt),
      expiresAtLabel: formatExactDate(f.expiresAt),
      lastAccessedAtLabel: formatExactDate(f.lastAccessedAt),
    }));

    res.render("share-overview", {
      title: "Share Overview",
      errors: [],
      formData: {}, // NOTE & REMINDER: req.body is not used in GET
      // csrfToken: req.csrfToken(), // Implementing all of these in router/appRouter.js instead as I needed a workaround for one or two routes
      shareLinks: formattedShareLinks,
      shareUrl,
    });
  } catch (err) {
    next(err);
  }
}

async function postUserShareLinkIsActiveUpdate(req, res, next) {
  try {
    const shareLinkId = req.params.shareLinkId;
    const userId = req.user.id;

    // Retrieve the share link so we can verify that it exists and belongs to the authenticated user.
    const shareLink = await getShareLinkById(shareLinkId);

    if (!shareLink) {
      // return res.status(404).render("404");
      const err = new Error("Shared link not found.");
      err.status = 404;

      return next(err);
    }

    if (shareLink.userId !== userId) {
      // return res.sendStatus(403);
      const err = new Error(
        "You do not have permission to access this shared link.",
      );
      err.status = 403;

      return next(err);
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
      // return res.status(404).render("404");
      const err = new Error("Shared link not found.");
      err.status = 404;

      return next(err);
    }

    if (shareLink.userId !== userId) {
      // return res.sendStatus(403);
      const err = new Error(
        "You do not have permission to access this shared link.",
      );
      err.status = 403;

      return next(err);
    }

    await deleteShare(shareLinkId);

    res.redirect("/app/share-overview");
  } catch (err) {
    next(err);
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
