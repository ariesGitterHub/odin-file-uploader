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

appRouter.get("/admin", csrfProtection, csrfTokenMiddleware, getAdminPage);

appRouter.get(
  "/admin-edit/:userId",
  requireAdmin,
  csrfProtection,
  csrfTokenMiddleware,
  getAdminEditPage,
);

appRouter.post(
  "/admin-edit/:userId",
  requireAdmin,
  csrfProtection,
  postAdminEditPage,
);

appRouter.post(
  "/admin/delete-user/:userId",
  requireAdmin,
  csrfProtection,
  deleteUserProfileByAdmin,
);

appRouter.get(
  "/user-data",
  csrfProtection,
  csrfTokenMiddleware,
  getUserDataPage,
);

appRouter.get(
  "/user-folder/:folderId",
  csrfProtection,
  csrfTokenMiddleware,
  getUserFolderPage,
);

// No csrfProtection or csrfTokenMiddleware needed below);
appRouter.get(
  "/preview-file/:fileId",
  getUserFilePreview,
);

appRouter.get(
  "/share-folder/:folderId",
  csrfProtection,
  csrfTokenMiddleware,
  getUserShareLinkFolderPage,
);

appRouter.post(
  "/share-folder/:folderId",
  csrfProtection,
  postUserShareLinkFolderPage,
);

appRouter.get(
  "/share-file/:fileId",
  csrfProtection,
  csrfTokenMiddleware,
  getUserShareLinkFilePage,
);

appRouter.post(
  "/share-file/:fileId",
  csrfProtection,
  postUserShareLinkFilePage,
);

appRouter.get("/share-overview/",
  csrfProtection,
  csrfTokenMiddleware, 
  getUserShareOverviewPage
);

appRouter.get(
  "/user-folder-edit/:folderId",
  csrfProtection,
  csrfTokenMiddleware,
  getUserFolderEditPage,
);

appRouter.post(
  "/user-folder-edit/:folderId",
  csrfProtection,
  postUserFolderEditPage,
);

appRouter.post(
  "/change-active-status/:shareLinkId",
  csrfProtection,
  postUserShareLinkIsActiveUpdate,
);

appRouter.get("/share-page/:token", getPublicSharePage);

appRouter.post(
  "/delete-your-folder/:folderId",
  csrfProtection,
  deleteUserFolderPage,
);

appRouter.post(
  "/user-folder/:folderId/delete-your-file/:fileId",
  csrfProtection,
  deleteUserFile,
);

appRouter.post(
  "/delete-your-shared-item/:shareLinkId",
  csrfProtection,
  deleteUserShare,
);

appRouter.get(
  "/user-profile",
  csrfProtection,
  csrfTokenMiddleware,
  getUserProfilePage,
);

appRouter.post(
  "/delete-your-account",
  csrfProtection,
  deleteUserProfileByUser,
);

appRouter.post("/user-profile", csrfProtection, postUserProfilePage);
appRouter.get(
  "/new-folder",
  csrfProtection,
  csrfTokenMiddleware,
  getNewFolderPage,
);

appRouter.post("/new-folder", csrfProtection, postNewFolderPage);
appRouter.get("/new-file", csrfProtection, csrfTokenMiddleware, getNewFilePage);

appRouter.post(
  "/new-file",
  upload.single("file"),
  validateUploadFile,
  csrfProtection,
  postNewFilePage,
);

appRouter.get(
  "/user-file-edit/:fileId",
  csrfProtection,
  csrfTokenMiddleware,
  getUserFileEditPage,
);

appRouter.post("/user-file-edit/:fileId", csrfProtection, postUserFileEditPage);

// No csrfProtection or csrfTokenMiddleware needed below);
appRouter.get("/download-folder/:folderId", downloadFolder);

// No csrfProtection or csrfTokenMiddleware needed below);
appRouter.get("/download-file/:fileId", downloadFile);

appRouter.get("/share-page-download-folder/:token", getPublicShareDownloadFolder);
appRouter.get("/share-page-download-file/:token", getPublicShareDownloadFile);

appRouter.get("/share-page-preview-file/:token", getPublicShareFilePreview);

module.exports = appRouter;
