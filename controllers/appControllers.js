const passwordRules = require("../config/passwordRules");

// CONTROLLER: INDEX (index.ejs)
// async function getHome(req, res, next) {
//   try {
//     const siteSettings = await getAllSiteControls();
//     const isMaintenanceModeEnv = process.env.MAINTENANCE_MODE === "true";
//     const isMaintenanceModeDb = siteSettings.maintenance_mode || false;
//     const isMaintenanceModeActive = isMaintenanceModeEnv || isMaintenanceModeDb;

//     if (isMaintenanceModeActive) {
//       res.render("maintenance", {
//         title: "Maintenance",
//       });
//     } else {
//       return res.render("index", {
//         title: "Home",
//       });
//     }
//   } catch (err) {
//     next(err);
//   }
// }

async function getHome(req, res, next) {
  try {
    res.render("index", {
      title: "Home",
    });
  } catch (err) {
    next(err);
  }
}

// *** AUTH CONTROLLERS

// CONTROLLER: SIGN-UP PAGE (sign-up.ejs)
async function getSignUpPage(req, res, next) {
  try {
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

module.exports = {
  getHome,
  getSignUpPage,
};
