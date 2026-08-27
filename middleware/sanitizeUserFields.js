const { body } = require("express-validator");

// This function will sanitize the fields dynamically
const sanitizeUserFields = (fields = []) => {
  return fields.map((field) => {
    switch (field.type) {
      case "string":
        return body(field.name).trim().optional(); // .escape() was overkill, Inputs should not be sanitized to that degree
      case "number":
        return body(field.name).optional().isNumeric().toInt();
      default:
        return body(field.name).trim().optional(); // .escape() was overkill, Inputs should not be sanitized to that degree
    }
  });
};

module.exports = sanitizeUserFields;
