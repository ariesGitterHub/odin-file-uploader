// CONTROLLER: HOME (INDEX) PAGE

async function getHomePage(req, res, next) {
  try {
    res.render("index", {
      title: "Home",
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getHomePage,
};
