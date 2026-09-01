// REMINDER - Instead of checking req.user inside every controller, use authentication middleware on protected /app routes; makes controllers safe because requireAuth guarantees the request is authenticated before the controller runs

function requireAuth(req, res, next) {
  if (!req.isAuthenticated()) {
    const err = new Error("Your session has expired. Please log in again.");
    err.status = 401;
    err.code = "SESSION_EXPIRED";

    return next(err);
  }

  next();
}

module.exports = { requireAuth };
