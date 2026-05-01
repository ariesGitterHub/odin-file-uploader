const csurf = require("@dr.pogodin/csurf");

const csrfProtection = csurf({
  cookie: {
    httpOnly: true, // Prevents JS access to the CSRF cookie
    secure: process.env.NODE_ENV === "production", // Only use HTTPS in production
    sameSite: "Strict", // Mitigates CSRF attacks
    maxAge: 1000 * 60 * 60 * 1, // 1 hour validity
  },
});

// CSRF middleware that makes the token available globally in views
const csrfTokenMiddleware = (req, res, next) => {
  // Add the CSRF token to res.locals for all GET requests
  if (req.method === "GET") {
    res.locals.csrfToken = req.csrfToken(); // Store CSRF token in locals
  }
  next(); // Proceed to the next middleware
};

// Custom error handler for CSRF errors
const csrfErrorHandler = (err, req, res, next) => {
  if (err.code === "EBADCSRFTOKEN") {
    // Forward the CSRF error to the generic error handler
    err.status = 403;
    err.message = "CSRF token invalid or missing";
    next(err); // Pass the error to the next middleware (error handler)
  } else {
    next(err); // Continue to the next middleware if it's not a CSRF error
  }
};

module.exports = {
  csrfProtection,
  csrfTokenMiddleware,
  csrfErrorHandler,
};
