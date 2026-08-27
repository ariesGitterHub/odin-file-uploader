function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "ADMIN") {
    console.log("ADMIN check = ", req.user.role);

    return res.status(403).send("Forbidden");
  }
  next();
}

module.exports = { requireAdmin };
