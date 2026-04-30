module.exports = (err, req, res, next) => {
  console.error(err);

  const status = err.status || 500;

  const ERROR_MAP = {
    400: {
      title: "400 - Bad Request",
      defaultMessage:
        "Your request was malformed. Please check your input and try again.",
    },
    401: {
      title: "401 - Unauthorized",
      defaultMessage: "You must be logged in to access this page.",
    },
    403: {
      title: "403 - Forbidden",
      defaultMessage: "You do not have permission to access this resource.",
      overrides: {
        ACCOUNT_DISABLED:
          "Your account has been disabled. Please contact support.",
        CSRF_INVALID: "CSRF token invalid or missing",
      },
    },
    404: {
      title: "404 - Not Found",
      defaultMessage: "Sorry, we couldn't find the page you were looking for.",
    },
    500: {
      title: "500 - Internal Server Error",
      defaultMessage:
        process.env.NODE_ENV === "production"
          ? "Something went wrong."
          : err.stack,
    },
  };

  const config = ERROR_MAP[status] || {
    title: `${status} - Unknown Error`,
    defaultMessage: "An unknown error occurred.",
  };

  const message =
    (config.overrides && err.code && config.overrides[err.code]) ||
    err.message ||
    config.defaultMessage;

  res.status(status).render("error-page", {
    title: config.title,
    error: message,
    status,
    code: err.code,
  });
};
