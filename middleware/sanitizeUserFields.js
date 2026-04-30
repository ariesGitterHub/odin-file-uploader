const { body } = require("express-validator");

// This function will sanitize the fields dynamically
// NOTE - see other/sanitizeUserFields - old.js for old scheme
const sanitizeUserFields = (fields = []) => {
  return fields.map((field) => {
    switch (field.type) {
      case "string":
        return body(field.name).trim().optional(); // .escape() was overkill, Inputs should not be sanitized to that degree
      case "number":
        return body(field.name).optional().isNumeric().toInt();
    //   case "date":
    //     return body(field.name).optional().isISO8601(); // Treat birthdate as string for safety
      default:
        return body(field.name).trim().optional(); // .escape() was overkill, Inputs should not be sanitized to that degree
    }
  });
};

module.exports = sanitizeUserFields;
