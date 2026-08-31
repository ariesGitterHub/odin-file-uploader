function formatValidationErrors(validationErrors) {
  const formattedErrors = [];
  const seen = new Set();

  validationErrors.array().forEach((err) => {
    if (!seen.has(err.path)) {
      formattedErrors.push({
        field: err.path,
        message: err.msg,
      });

      seen.add(err.path);
    }
  });

  return formattedErrors;
}

module.exports = {
  formatValidationErrors,
};
