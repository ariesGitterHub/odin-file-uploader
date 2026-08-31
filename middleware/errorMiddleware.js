const { fileSizeLimitMB } = require("../config/sizeLimits");

module.exports = (err, req, res, next) => {
  console.error(err);

  // const status = err.status || 500;

    if (err.code === "LIMIT_FILE_SIZE") {
      err.status = 413;
    }

    if (err.code === "INVALID_MIME_TYPE") {
      err.status = 400;
    }

    const status =
      Number.isInteger(err.status) && err.status >= 400 && err.status < 600
        ? err.status
        : 500;

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
    409: {
      title: "409 - Conflict",
      defaultMessage:
        "The request could not be completed because it conflicts with the current state of the resource.",
    },
    413: {
      title: "413 - File Too Large",
      defaultMessage: `The selected file exceeds the maximum upload size of ${fileSizeLimitMB} MB.`,
    },
    422: {
      title: "422 - Unprocessable Content",
      defaultMessage:
        "The request was valid, but the submitted data could not be processed.",
    },
    429: {
      title: "429 - Too Many Requests",
      defaultMessage:
        "Too many requests have been made. Please wait a moment and try again.",
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

  // const message =
  //   (config.overrides && err.code && config.overrides[err.code]) ||
  //   err.message ||
  //   config.defaultMessage;

  let message;

  if (status === 500) {
    message =
      process.env.NODE_ENV === "production"
        ? config.defaultMessage
        : err.stack || err.message;
  } else {
    message =
      (config.overrides && err.code && config.overrides[err.code]) ||
      err.message ||
      config.defaultMessage;
  }

  res.status(status).render("error-page", {
    title: config.title,
    error: message,
    status,
    code: err.code,
  });
};
