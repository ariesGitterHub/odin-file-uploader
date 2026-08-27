// Below not used in this project; possible future use?

const { check } = require("express-validator");
const { checkIfEmailAlreadyExists } = require("../services/auth.service.js");
const passwordRules = require("../config/passwordRules"); // This populates the password-rules.ejs with the config/ password scheme

const emailValidator = check("email")
  .trim()
  .notEmpty()
  .withMessage("Email cannot be empty")
  .isEmail()
  .withMessage("Invalid email format")
  .custom(async (email) => {
    const existingUser = await checkIfEmailAlreadyExists(
      email.trim().toLowerCase(),
    );
    if (existingUser) {
      throw new Error("Email is already taken.");
    }
    return true;
  });

const passwordValidator = check("password")
  .optional({ checkFalsy: true })
  .custom((value) => {
    const hasMinLength = value.length >= passwordRules.minLength;
    const hasLower = /[a-z]/.test(value);
    const hasUpper = /[A-Z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSpecial = new RegExp("[" + passwordRules.specialChars + "]").test(
      value,
    ); // Fixed this line to correctly use the specialChars rule.

    if (!(hasMinLength && hasLower && hasUpper && hasNumber && hasSpecial)) {
      throw new Error("weak password, see below.");
    }

    return true;
  });

const confirmPasswordValidator = check("confirm_password")
  .optional({ checkFalsy: true })
  .custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Passwords do not match.");
    }

    return true;
  });

// Export as group
module.exports = {
  createUserUpdateValidator: [
    emailValidator,
    passwordValidator,
    confirmPasswordValidator,
  ],
};
