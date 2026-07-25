const { Router } = require("express");
const upload = require("../middleware/multer");

// const { requireRole } = require("../utils/permissions");
// const {
//   createUserValidatorSignUp,
//   createUserValidatorAdminCreate,
// } = require("../middleware/validationCreateUser");
// const {
//   adminEditUserValidator,
//   editProfileUserValidator,
// } = require("../middleware/validationEditUser");
// const sanitizeUserFields = require("../middleware/sanitizeUserFields");
// const rateLimiter = require("../middleware/rateLimiters");
// const {
//   getAdminPage,
//   postNewSiteSettingsAdminPage,
//   getAdminCreatePage,
//   postAdminCreatePage,
//   getAdminEditPage,
//   postAdminEditPage,
//   deleteUserAccount,
// } = require("../controllers/adminControllers");
// const {
//   getSignUpPage,
//   postSignUpPage,
//   getLogInPage,
//   postLogInPage,
//   postLogOut,
// } = require("../controllers/authControllers");
// const {
//   getMessageBoards,
//   getTopicPage,
//   getMessageDetails,
//   getMaxMessageChars,
//   postNewMessage,
//   postStickyMessageToggle,
//   postEditMessage,
//   postReplyMessage,
//   deleteUserMessage,
//   postLikeMessageToggle,
//   getTopicNamesForDropdown,
//   getMessagesForTopic,
// } = require("../controllers/messageControllers");
// const {
//   getMemberDirectory,
//   getMemberInvite,
//   postMemberInviteAccepted,
//   postMemberInviteDeclined,
// } = require("../controllers/memberControllers");

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
  deleteUserFolderPage,
  deleteUserFile,
  getEditFolderPage,
  postEditFolderPage,
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

// const {
//   getModalDataToFrontend,
//   getUserId,
//   getYourProfilePage,
//   deleteUserAccount,
//   getEditProfilePage,
//   postEditProfilePage,
//   postYourProfilePageAvatar,
// } = require("../controllers/userControllers");
const appRouter = Router();

// // ROUTES: INDEX/HOME (index.ejs), ALSO USED FOR MAINTENANCE (maintenance.ejs)
appRouter.get("/", getHomePage);

// // ****
// // APIs

// // ROUTES: CURRENT USER API FOR MODAL FETCH
// appRouter.get("/modal-fetch", requireRole("guest"), getModalDataToFrontend);

// // ROUTES: USER ID API FOR FRONTEND FETCH
// appRouter.get("/user-id/:id", requireRole("guest"), getUserId);

// // ROUTES: MESSAGES API FOR FRONTEND FETCH
// appRouter.get("/message/:id", requireRole("guest"), getMessageDetails);

// // ROUTES: CONFIG MAX CHARS API FOR FRONTEND FETCH
// appRouter.get("/config/max-chars", requireRole("guest"), getMaxMessageChars);

// // Index/Maintenance

// // ROUTES: INDEX/HOME (index.ejs), ALSO USED FOR MAINTENANCE (maintenance.ejs)
// appRouter.get("/", getHome);

// // Auth

// // ROUTES: SIGN UP PAGE (sign-up.ejs)
appRouter.get("/sign-up", getSignUpPage);
// appRouter.post("/sign-up", postSignUpPage);
appRouter.post(
  "/sign-up",
  createUserValidatorSignUp,
  // sanitizeUserFields([
  //   { name: "first_name", type: "string" },
  //   { name: "last_name", type: "string" },
  // ]),
  // rateLimiter,
  postSignUpPage,
);

// // ROUTES: LOG IN PAGE (log-in.ejs)
appRouter.get("/log-in", getLogInPage);
appRouter.post("/log-in", postLogInPage);
// appRouter.post("/log-in", rateLimiter, postLogInPage);

// ROUTES: LOG OUT BUTTON
appRouter.post(
  "/log-out",
  (req, res, next) => {
    console.log("👋 Logout form submitted, good bye!");
    next();
  },
  postLogOut,
);

// ROUTES: ADMIN PAGE

appRouter.get("/admin", getAdminPage);
appRouter.get("/admin-edit/:userId", getAdminEditPage);
appRouter.post("/admin-edit/:userId", postAdminEditPage);
appRouter.post("/admin/delete-user/:userId", deleteUserProfileByAdmin);

// // ROUTES: ADMIN PAGE (admin.ejs)
// appRouter.get("/admin", requireRole("admin"), getAdminPage);
// appRouter.post(
//   "/admin/config/site-controls",
//   requireRole("admin"),
//   postNewSiteSettingsAdminPage,
// );

// // ROUTE: DELETE ACCOUNT MODAL (warning-account-deletion.ejs)
// appRouter.post(
//   "/admin/delete-user-account",
//   requireRole("admin"),
//   deleteUserAccount,
// );

// // ROUTES: ADMIN CREATE PAGE (admin-create.ejs)
// const adminCreateFields = [
//   { name: "first_name", type: "string" },
//   { name: "last_name", type: "string" },
//   { name: "birthdate", type: "string" },
//   { name: "notes", type: "string" },
// ];

// appRouter.get("/admin-create", requireRole("admin"), getAdminCreatePage);
// appRouter.post(
//   "/admin-create",
//   requireRole("admin"),
//   createUserValidatorAdminCreate,
//   sanitizeUserFields(adminCreateFields),
//   postAdminCreatePage,
// );

// // ROUTES: ADMIN EDIT PAGE (admin-edit.ejs)
// const adminEditFields = [
//   { name: "first_name", type: "string" },
//   { name: "last_name", type: "string" },
//   { name: "birthdate", type: "string" },
//   { name: "permission_status", type: "string" },
//   // { name: "verified_by_admin", type: "boolean" }, // This failed, see comments in middleware/sanitizerUserFields.js
//   // { name: "guest_upgrade_invite", type: "boolean" }, // This failed, see comments in middleware/sanitizerUserFields.js
//   { name: "invite_decision", type: "string" },
//   // { name: "is_active", type: "boolean" }, // This failed, see comments in middleware/sanitizerUserFields.js
//   { name: "avatar_type", type: "string" },
//   { name: "avatar_color_fg", type: "string" },
//   { name: "avatar_color_bg_top", type: "string" },
//   { name: "avatar_color_bg_bottom", type: "string" },
//   { name: "phone", type: "string" },
//   { name: "street_address", type: "string" },
//   { name: "apt_unit", type: "string" },
//   { name: "city", type: "string" },
//   { name: "us_state", type: "string" },
//   { name: "zip_code", type: "string" },
//   { name: "notes", type: "string" },
// ];

// appRouter.get("/admin-edit/:id", requireRole("admin"), getAdminEditPage);
// appRouter.post(
//   "/admin-edit/:id",
//   requireRole("admin"),
//   adminEditUserValidator(),
//   sanitizeUserFields(adminEditFields),
//   postAdminEditPage,
// );

// // Info

// // ROUTES: SITE INFO PAGE (info.ejs)
// appRouter.get("/info", requireRole("guest"), getInfo);

// // Message Related

// // ROUTES: NEW MESSAGE MODAL (new-message.ejs)
// const newMessageFields = [
//   { name: "title", type: "string" },
//   { name: "body", type: "string" },
//   { name: "topic_id", type: "number" },
// ];
// appRouter.post(
//   "/new-message",
//   requireRole("guest"),
//   sanitizeUserFields(newMessageFields),
//   postNewMessage,
// );

// // ROUTES: EDIT MESSAGE MODAL (edit-message.ejs)
// const editMessageFields = [
//   { name: "title", type: "string" },
//   { name: "body", type: "string" },
// ];
// appRouter.post(
//   "/message-boards/edit-message",
//   requireRole("guest"),
//   sanitizeUserFields(editMessageFields),
//   postEditMessage,
// );

// // ROUTES: REPLY MESSAGE MODAL (reply-message.ejs)
// const replyMessageFields = [{ name: "body", type: "string" }];
// appRouter.post(
//   "/message-boards/reply-message",
//   requireRole("guest"),
//   sanitizeUserFields(replyMessageFields),
//   postReplyMessage,
// );

// // ROUTES: TOPICS API USED NEW MESSAGE DROPDOWN
// appRouter.get("/topics", requireRole("guest"), getTopicNamesForDropdown);

// // ROUTES: MESSAGE BOARDS PAGE
// appRouter.get("/message-boards", requireRole("guest"), getMessageBoards);

// // ROUTES: MESSAGE BOARDS BY TOPIC SLUG PAGE (message-boards.ejs by topic slug)
// appRouter.get("/message-boards/:slug", requireRole("guest"), getTopicPage);

// // ROUTEs: STICKY MESSAGE TOGGLE (new-message.ejs)
// appRouter.post(
//   "/message-boards/sticky-message",
//   requireRole("guest"),
//   postStickyMessageToggle,
// );

// // ROUTES: DELETE MESSAGE MODAL (warning-message-deletion.ejs)
// appRouter.post(
//   "/message-boards/delete-message",
//   requireRole("guest"),
//   deleteUserMessage,
// );

// // ROUTE: THREAD_PATH API FOR REPLY MESSAGES (?)
// // NOTE - getMessagesForTopic is used with threaded paths that get my messages replies to order properly; I experimented with commenting this out and message replies still ordered correctly, but leaving this in in case something else is relying on it.
// appRouter.get("/topics/:topicId/messages", getMessagesForTopic);

// // ROUTES: LIKE MESSAGE (message-boards.ejs by topic slug)
// appRouter.post("/message-boards/like-message", postLikeMessageToggle);

// // User Related

// // ROUTES: YOUR PROFILE PAGE (your-profile.ejs)
// appRouter.get("/your-profile", requireRole("guest"), getYourProfilePage);

// // ROUTE: DELETE YOUR ACCOUNT MODAL (warning-account-deletion.ejs)
// appRouter.post(
//   "/your-profile/delete-your-account",
//   requireRole("guest"),
//   deleteUserAccount,
// );

// // ROUTE: EDIT PROFILE PAGE (edit-profile.ejs)
// const editProfileFields = [
//   { name: "first_name", type: "string" },
//   { name: "last_name", type: "string" },
//   { name: "birthdate", type: "string" },
//   { name: "phone", type: "string" },
//   { name: "street_address", type: "string" },
//   { name: "apt_unit", type: "string" },
//   { name: "city", type: "string" },
//   { name: "us_state", type: "string" },
//   { name: "zip_code", type: "string" },
// ];
// appRouter.get("/edit-profile", requireRole("guest"), getEditProfilePage);
// appRouter.post(
//   "/edit-profile",
//   requireRole("guest"),
//   editProfileUserValidator(),
//   sanitizeUserFields(editProfileFields),
//   postEditProfilePage,
// );

// // ROUTES: CHANGE AVATAR MODAL (change-avatar.ejs)
// const avatarFields = [
//   { name: "avatar_type", type: "string" },
//   { name: "avatar_color_fg", type: "string" },
//   { name: "avatar_color_bg_top", type: "string" },
//   { name: "avatar_color_bg_bottom", type: "string" },
// ];
// appRouter.post(
//   "/your-profile/change-avatar",
//   requireRole("guest"),
//   sanitizeUserFields(avatarFields),
//   postYourProfilePageAvatar,
// );

// // ROUTE: MEMBER DIRECTORY PAGE (member-directory.ejs)
// appRouter.get("/member-directory", requireRole("member"), getMemberDirectory);

// // ROUTE: MEMBER INVITATION PAGE (member-invite.ejs)
// const memberInviteAcceptedFields = [
//   { name: "phone", type: "string" },
//   { name: "street_address", type: "string" },
//   { name: "apt_unit", type: "string" },
//   { name: "city", type: "string" },
//   { name: "us_state", type: "string" },
//   { name: "zip_code", type: "string" },
// ];
// appRouter.get("/member-invite", requireRole("guest"), getMemberInvite);
// appRouter.post(
//   "/member-invite/accepted",
//   requireRole("guest"),
//   sanitizeUserFields(memberInviteAcceptedFields),
//   postMemberInviteAccepted,
// );
// appRouter.post(
//   "/member-invite/declined",
//   requireRole("guest"),
//   postMemberInviteDeclined,
// );

appRouter.get("/user-data", getUserDataPage);
// appRouter.get("/user-folder", getUserFolderPage);
appRouter.get("/user-folder/:folderId", getUserFolderPage);
appRouter.get("/edit-folder/:folderId", getEditFolderPage);
appRouter.post("/edit-folder/:folderId", postEditFolderPage);
appRouter.post("/delete-your-folder/:folderId", deleteUserFolderPage);
appRouter.post("/user-folder/:folderId/delete-your-file/:fileId", deleteUserFile);
appRouter.get("/user-profile", getUserProfilePage);
appRouter.post(
  "/delete-your-account",
  createUserUpdateValidator,
  // sanitizeUserFields([
  //   { name: "first_name", type: "string" },
  //   { name: "last_name", type: "string" },
  // ]),
  // rateLimiter,
  deleteUserProfileByUser,
);
appRouter.post("/user-profile", postUserProfilePage);
appRouter.get("/new-folder", getNewFolderPage);
appRouter.post("/new-folder", postNewFolderPage);
appRouter.get("/new-file", getNewFilePage);
appRouter.post("/new-file", upload.single("file"), postNewFilePage);

module.exports = appRouter;
