const { Router } = require("express");
const upload = require("../middleware/multer");
const {
  csrfProtection,
  csrfTokenMiddleware,
} = require("../middleware/csrfMiddleware");
const { getHomePage } = require("../controllers/home.controller");
const {
  getAdminPage,
  getAdminEditPage,
  postAdminEditPage,
  deleteUserProfileByAdmin,
} = require("../controllers/admin.controller");
const {
  getSignUpPage,
  postSignUpPage,
  getLogInPage,
  postLogInPage,
  postLogOut,
} = require("../controllers/auth.controller");
const {
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
} = require("../controllers/user-data.controller");
const {
  getUserShareLinkFolderPage,
  postUserShareLinkFolderPage,
  getUserShareLinkFilePage,
  postUserShareLinkFilePage,
  getUserShareOverviewPage,
  postUserShareLinkIsActiveUpdate,
  deleteUserShare,
} = require("../controllers/user-share.controller");
const {
  getPublicSharePage,
  getPublicShareDownloadFolder,
  getPublicShareDownloadFile,
  getPublicShareFilePreview,
} = require("../controllers/public-share.controller");
const {
  createUserValidatorSignUp,
} = require("../middleware/validateCreateUser");

// Below not used in this project; possible future use?
// const {
//   createUserUpdateValidator,
// } = require("../middleware/validateUpdateUser");

const validateUploadFile = require("../middleware/validateUploadFile");
const { requireAuth } = require("../middleware/requireAuth");
const { requireAdmin } = require("../utils/requireAdmin");

const appRouter = Router();

appRouter.get("/", getHomePage);

appRouter.get("/sign-up", csrfProtection, csrfTokenMiddleware, getSignUpPage);
appRouter.post(
  "/sign-up",
  csrfProtection,
  createUserValidatorSignUp,
  postSignUpPage,
);

appRouter.get(
  "/log-in",
  csrfProtection,
  csrfTokenMiddleware,
  getLogInPage
);

appRouter.post("/log-in", csrfProtection, postLogInPage);

appRouter.post(
  "/log-out",
  (req, res, next) => {
    console.log("👋 Logout form submitted, good bye!");
    next();
  },
  postLogOut,
);

appRouter.get(
  "/admin",
  requireAuth,
  csrfProtection,
  csrfTokenMiddleware,  
  getAdminPage,  
);

appRouter.get(
  "/admin-edit/:userId",
  requireAuth,
  requireAdmin,
  csrfProtection,
  csrfTokenMiddleware,
  getAdminEditPage,
);

appRouter.post(
  "/admin-edit/:userId",
  requireAuth,
  requireAdmin,
  csrfProtection,
  postAdminEditPage,
);

appRouter.post(
  "/admin/delete-user/:userId",
  requireAuth,
  requireAdmin,
  csrfProtection,
  deleteUserProfileByAdmin,
);

appRouter.get(
  "/user-data",
  requireAuth,
  csrfProtection,
  csrfTokenMiddleware,
  getUserDataPage,
);

appRouter.get(
  "/user-folder/:folderId",
  requireAuth,
  csrfProtection,
  csrfTokenMiddleware,
  getUserFolderPage,
);

// No csrfProtection or csrfTokenMiddleware needed below);
appRouter.get("/preview-file/:fileId", requireAuth, getUserFilePreview);

appRouter.get(
  "/share-folder/:folderId",
  requireAuth,
  csrfProtection,
  csrfTokenMiddleware,
  getUserShareLinkFolderPage,
);

appRouter.post(
  "/share-folder/:folderId",
  requireAuth,
  csrfProtection,
  postUserShareLinkFolderPage,
);

appRouter.get(
  "/share-file/:fileId",
  requireAuth,
  csrfProtection,
  csrfTokenMiddleware,
  getUserShareLinkFilePage,
);

appRouter.post(
  "/share-file/:fileId",
  requireAuth,
  csrfProtection,
  postUserShareLinkFilePage,
);

appRouter.get(
  "/share-overview/",
  requireAuth,
  csrfProtection,
  csrfTokenMiddleware,
  getUserShareOverviewPage,
);

appRouter.get(
  "/user-folder-edit/:folderId",
  requireAuth,
  csrfProtection,
  csrfTokenMiddleware,
  getUserFolderEditPage,
);

appRouter.post(
  "/user-folder-edit/:folderId",
  requireAuth,
  csrfProtection,
  postUserFolderEditPage,
);

appRouter.post(
  "/change-active-status/:shareLinkId",
  requireAuth,
  csrfProtection,
  postUserShareLinkIsActiveUpdate,
);

appRouter.post(
  "/delete-your-folder/:folderId",
  requireAuth,
  csrfProtection,
  deleteUserFolderPage,
);

appRouter.post(
  "/user-folder/:folderId/delete-your-file/:fileId",
  requireAuth,
  csrfProtection,
  deleteUserFile,
);

appRouter.post(
  "/delete-your-shared-item/:shareLinkId",
  requireAuth,
  csrfProtection,
  deleteUserShare,
);

appRouter.get(
  "/user-profile",
  requireAuth,
  csrfProtection,
  csrfTokenMiddleware,
  getUserProfilePage,
);

appRouter.post(
  "/delete-your-account",
  requireAuth,
  csrfProtection,
  deleteUserProfileByUser,
);

appRouter.post(
  "/user-profile",
  requireAuth,
  csrfProtection,
  postUserProfilePage,
);

appRouter.get(
  "/new-folder",
  requireAuth,
  csrfProtection,
  csrfTokenMiddleware,
  getNewFolderPage,
);

appRouter.post("/new-folder", requireAuth, csrfProtection, postNewFolderPage);

appRouter.get(
  "/new-file",
  requireAuth,
  csrfProtection,
  csrfTokenMiddleware,
  getNewFilePage,
);

appRouter.post(
  "/new-file",
  requireAuth,  
  upload.single("file"),
  validateUploadFile,
  csrfProtection,
  postNewFilePage,
);

appRouter.get(
  "/user-file-edit/:fileId",
  requireAuth,
  csrfProtection,
  csrfTokenMiddleware,
  getUserFileEditPage,
);

appRouter.post(
  "/user-file-edit/:fileId",
  requireAuth,
  csrfProtection,
  postUserFileEditPage,
);

// No csrfProtection or csrfTokenMiddleware needed below);
appRouter.get("/download-folder/:folderId", requireAuth, downloadFolder);

// No csrfProtection or csrfTokenMiddleware needed below);
appRouter.get("/download-file/:fileId", requireAuth, downloadFile);

appRouter.get("/share-page/:token", getPublicSharePage);

appRouter.get("/share-page-download-folder/:token", getPublicShareDownloadFolder);
appRouter.get("/share-page-download-file/:token", getPublicShareDownloadFile);

appRouter.get("/share-page-preview-file/:token", getPublicShareFilePreview);

module.exports = appRouter;
