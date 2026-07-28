const fs = require("fs/promises");
const { isAllowedMimeType } = require("../utils/mimeUtils");

async function validateUploadedFile(req, res, next) {
  // No file was uploaded
  if (!req.file) {
    return res.status(400).render("new-file", {
      error: "Please select a file.",
    });
  }

  try {
    const { fileTypeFromFile } = await import("file-type");

    // Check the actual contents of the file
    const detectedType = await fileTypeFromFile(req.file.path);

    if (!detectedType) {
      await fs.unlink(req.file.path);

      return res.status(400).render("new-file", {
        error: "Unable to determine file type.",
      });
    }

    // Compare detected file type against your allowlist
    if (!isAllowedMimeType(detectedType.mime)) {
      await fs.unlink(req.file.path);

      return res.status(400).render("new-file", {
        error: "This file type is not allowed.",
      });
    }

    next();
  } catch (error) {
    console.error("File validation failed:", error);

    // Cleanup uploaded file if something goes wrong
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    next(error);
  }
}

module.exports = validateUploadedFile;
