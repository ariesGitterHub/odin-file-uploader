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

module.exports = {
  getHome
};
