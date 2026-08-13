const { Router } = require("express");
const upload = require("../middleware/multer");
const {
  csrfProtection,
  csrfTokenMiddleware,
} = require("../middleware/csrfMiddleware");

const {
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
  getUserFilePreview,

  getUserShareLinkFolderPage,
  postUserShareLinkFolderPage,

  getUserShareOverviewPage,
  postUserShareLinkIsActiveUpdate,
  getUserShareLinkFilePage,
  postUserShareLinkFilePage,

  getUserFolderEditPage,
  postUserFolderEditPage,
  deleteUserFolderPage,

  getUserFileEditPage,
  postUserFileEditPage,
  deleteUserFile,
  deleteUserShare,

  getUserProfilePage,
  postUserProfilePage,
  deleteUserProfileByUser,

  getNewFolderPage,
  postNewFolderPage,
  getNewFilePage,
  postNewFilePage,

  downloadFile,
  downloadFolder,
} = require("../controllers/appControllers");

const {
  createUserValidatorSignUp,
} = require("../middleware/validateCreateUser");

const {
  createUserUpdateValidator,
} = require("../middleware/validateUpdateUser");

const validateUploadFile = require("../middleware/validateUploadFile");

// const { requireAdmin, adminLogCheck } = require("../utils/requireAdmin");  // TODO - remove later --> adminLogCheck
const { requireAdmin } = require("../utils/requireAdmin");  // TODO - remove later --> adminLogCheck

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
  // adminLogCheck, // TODO - remove later
  csrfProtection,
  csrfTokenMiddleware,
  getAdminEditPage,
);

appRouter.post(
  "/admin-edit/:userId",
  requireAdmin,
  // adminLogCheck, // TODO - remove later
  csrfProtection,
  postAdminEditPage,
);

appRouter.post(
  "/admin/delete-user/:userId",
  requireAdmin,
  // adminLogCheck, // TODO - remove later
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

appRouter.get(
  "/view-file/:fileId",
  // csrfProtection,
  // csrfTokenMiddleware,
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
// appRouter.get("/new-file", getNewFilePage);
// appRouter.post("/new-file", upload.single("file"), postNewFilePage);
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

// appRouter.get("/download-file/:fileId", csrfProtection, csrfTokenMiddleware, downloadFile);
appRouter.get("/download-file/:fileId", downloadFile);
// appRouter.get("/download-folder/:folderId", csrfProtection, csrfTokenMiddleware, downloadFolder);
appRouter.get("/download-folder/:folderId", downloadFolder);

module.exports = appRouter;
