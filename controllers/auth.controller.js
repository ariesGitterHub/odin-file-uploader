const bcrypt = require("bcryptjs");
const passport = require("passport");
const { validationResult } = require("express-validator");
const passwordRules = require("../config/passwordRules"); // This populates the password-rules.ejs with the config/ password scheme
const { createUser } = require("../services/user.service");

// CONTROLLERS: SIGN-UP PAGE (sign-up.ejs)

async function getSignUpPage(req, res, next) {
  try {
    // REMINDER - the neighborhood message app used a maintenance mode that allowed a different landing screen; this app does not.
    // if (await isMaintenanceMode()) {
    //   return res.redirect("/");
    // }

    res.render("sign-up", {
      title: "Sign Up",
      errors: [],
      passwordRules,
      formData: {}, // NOTE & REMINDER: req.body is not used in GET
    });
  } catch (err) {
    next(err);
  }
}

async function postSignUpPage(req, res, next) {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const formattedErrors = [];
      const seen = new Set();

      errors.array().forEach((err) => {
        if (!seen.has(err.path)) {
          formattedErrors.push({
            field: err.path,
            message: err.msg,
          });
          seen.add(err.path); // Seen ensures only one error per field, so your EJS shows one message for password, not multiple.
        }
      });

      return res.render("sign-up", {
        title: "Sign Up",
        errors: formattedErrors,
        formData: req.body || {},
        passwordRules,
        // csrfToken: req.csrfToken(), // Implementing all of these in router/appRouter.js instead as I needed a workaround for one or two routes
      });
    }

    const { first_name, last_name, email, password } = req.body;

    const password_hash = await bcrypt.hash(password, 12);

    await createUser({
      firstName: first_name,
      lastName: last_name,
      email: email.trim().toLowerCase(),
      passwordHash: password_hash,
    });

    return res.redirect("/app/log-in");
  } catch (err) {
    console.error("Error during sign-up:", err);
    next(err);
  }
}

// CONTROLLERS: LOG-IN PAGE (log-in.ejs)

async function getLogInPage(req, res, next) {
  try {
    // REMINDER - the neighborhood message app used a maintenance mode that allowed a different landing screen; this app does not.
    // if (await isMaintenanceMode()) {
    //   return res.redirect("/");
    // }

    res.render("log-in", {
      title: "log In",
      errors: [],
      passwordRules,
      formData: {}, // NOTE & REMINDER: req.body is not used in GET
    });
  } catch (err) {
    next(err);
  }
}

async function postLogInPage(req, res, next) {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.render("log-in", {
        title: "Log In",
        errors: [
          {
            field: "auth",
            // message: info?.message || "Invalid email or password", // NOTE - using the code below instead
            message: "Invalid email or password",
          },
        ],
        formData: req.body,
        csrfToken: req.csrfToken(), // !!! NOTE - Leave this be! Even though this is global for GET, I am putting this here explicitly to handle errors when validationCreateUser or validationEditUser catches an incorrect email, password, or confirm_password is used; without this here a 500 error pops off!
      });
    }

    req.login(user, (err) => {
      if (err) {
        return next(err);
      }

      console.log("🎈 User authenticated!");

      return res.redirect("/app/user-data");
    });
  })(req, res, next);
}

// CONTROLLER: LOG-OUT

async function postLogOut(req, res, next) {
  try {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.redirect("/app/log-in");
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSignUpPage,
  postSignUpPage,
  getLogInPage,
  postLogInPage,
  postLogOut,
};
