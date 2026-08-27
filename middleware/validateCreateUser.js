const { check } = require("express-validator");
const { checkIfEmailExistsForSignUp } = require("../services/auth.service.js");
const passwordRules = require("../config/passwordRules"); // This populates the password-rules.ejs with the config/ password scheme

const expectedInviteCodeAnswer = process.env.INVITE_CODE;

const emailValidator = check("email")
  .trim()
  .notEmpty()
  .withMessage("Email cannot be empty")
  .isEmail()
  .withMessage("Invalid email format")
  .custom(async (email) => {
    const existingUser = await checkIfEmailExistsForSignUp(
      email.trim().toLowerCase(),
    );
    if (existingUser) {
      throw new Error("Email is already taken.");
    }
    return true;
  });

const passwordValidator = check("password").custom((value) => {
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

const confirmPasswordValidator = check("confirm_password").custom(
  (value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Passwords do not match.");
    }

    return true;
  },
);

// Validator for the invite code that will prevent bots from signing up
const inviteCodeValidator = check("invite_code").custom((value) => {
  if (
    value.trim().toLowerCase() !== expectedInviteCodeAnswer.trim().toLowerCase()
  ) {
    throw new Error("Incorrect invite code");
  }

  return true;
});

// Export as group
module.exports = {
  createUserValidatorSignUp: [
    emailValidator,
    passwordValidator,
    confirmPasswordValidator,
    inviteCodeValidator,
  ],
};
