const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const passwordRules = require("../config/passwordRules"); // This populates the password-rules.ejs with the config/ password scheme
const { formatBytes } = require("../utils/formatBytes");
const { formatExactDate } = require("../utils/formatDate");
const { formatValidationErrors } = require("../utils/formatValidationErrors");
const {
  getAdminUserProfiles,
  getAdminUserProfile,
} = require("../services/admin.service");
const { updateUser, deleteUser } = require("../services/user.service");

// CONTROLLERS: ADMIN PAGE (admin.ejs, admin-edit.ejs)
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
        createdAtLabel: formatExactDate(f.createdAt),
        updatedAtLabel: formatExactDate(f.updatedAt),
        lastLoginAtLabel: formatExactDate(f.lastLoginAt),
      }))
      .sort(
        (
          a,
          b, // Use this to order by alphabet where asc cannot as prisma's asc sees "T" and "t" as different
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
      // csrfToken: req.csrfToken(), // Implementing all of these in router/appRouter.js instead as I needed a workaround for one or two routes
    });
  } catch (err) {
    next(err);
  }
}

async function getAdminEditPage(req, res, next) {
  if (req.user.role !== "ADMIN") {
    return res.sendStatus(403);
  }

  try {
    const userId = req.params.userId;

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
      // csrfToken: req.csrfToken(), // Implementing all of these in router/appRouter.js instead as I needed a workaround for one or two routes
    });
  } catch (err) {
    next(err);
  }
}

async function postAdminEditPage(req, res, next) {
  try {
    const userId = req.params.userId;

    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
      const errors = formatValidationErrors(validationErrors);

      return res.render("admin-edit", {
        title: "Admin Edit",
        errors,
        formData: req.body || {},
        passwordRules,
        // csrfToken: req.csrfToken(), // Implementing all of these in router/appRouter.js instead as I needed a workaround for one or two routes
      });
    }

    const { first_name, last_name, email, email_verified, password } = req.body;
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
    const userId = req.params.userId;
    const currentUser = req.user.id

    // Blocks admins from deleting their own accounts
    if (currentUser === userId) {
      const err = new Error("Admins cannot delete their own accounts.");
      err.status = 403;
      err.code = "ADMIN_SELF_DELETE_BLOCKED";
      return next(err);
    }

    await deleteUser(userId);
    return res.redirect("/app/admin");
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAdminPage,
  getAdminEditPage,
  postAdminEditPage,
  deleteUserProfileByAdmin,
};
