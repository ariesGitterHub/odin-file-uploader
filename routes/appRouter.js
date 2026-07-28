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
} = require("../controllers/appControllers");

const {
  createUserValidatorSignUp,
} = require("../middleware/validateCreateUser");

const {
  createUserUpdateValidator,
} = require("../middleware/validateUpdateUser");

const validateUploadFile = require("../middleware/validateUploadFile")

const appRouter = Router();

appRouter.get("/", getHomePage);

appRouter.get("/sign-up", csrfProtection, csrfTokenMiddleware, getSignUpPage);
appRouter.post(
  "/sign-up",
  csrfProtection,
  createUserValidatorSignUp,
  postSignUpPage,
);

appRouter.get("/log-in", csrfProtection, csrfTokenMiddleware, getLogInPage);
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
  // csrfProtection,
  // createUserValidatorSignUp,
  getAdminPage,
);
appRouter.get(
  "/admin-edit/:userId",
  csrfProtection,
  csrfTokenMiddleware,
  getAdminEditPage,
);
appRouter.post("/admin-edit/:userId", csrfProtection, postAdminEditPage);
appRouter.post(
  "/admin/delete-user/:userId",
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
  "/user-folder-edit/:folderId",
  csrfProtection,
  csrfTokenMiddleware,
  getUserFolderEditPage,
);

appRouter.post("/user-folder-edit/:folderId", csrfProtection, postUserFolderEditPage);
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

appRouter.get(
  "/user-profile",
  csrfProtection,
  csrfTokenMiddleware,
  getUserProfilePage,
);

appRouter.post(
  "/delete-your-account",
  csrfProtection,
  createUserUpdateValidator,
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

appRouter.post(
  "/user-file-edit/:fileId",
  csrfProtection,
  postUserFileEditPage,
);

module.exports = appRouter;
