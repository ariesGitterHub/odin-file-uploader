const fs = require("fs/promises");
const { isAllowedMimeType } = require("../utils/mimeUtils");

async function validateUploadFile(req, res, next) {
  // No file was uploaded
  if (!req.file) {
    return res.status(400).render("new-file", {
      error: "Please select a file.",
    });
  }

  try {
    const { fileTypeFromFile } = await import("file-type");

    // Check the actual contents of the file; file-type package can verify binary formats using file signatures
    // Text-based formats do not have signatures, so they rely on Multer's MIME allowlist validation
    const detectedType = await fileTypeFromFile(req.file.path);

    // If file-type can identify the file, verify the detected MIME type
    if (detectedType) {
      if (!isAllowedMimeType(detectedType.mime)) {
        await fs.unlink(req.file.path);

        return res.status(400).render("new-file", {
          error: "This file type is not allowed.",
        });
      }
    }

    // If file-type cannot identify the file, allow it to proceed; this covers text-based formats such as .txt, .csv, .html, .css, .js, and .xml; these files do not have unique binary signatures and were already checked by Multer

    next();
  } catch (error) {
    console.error("File validation failed:", error);

    // This will cleanup uploaded file if something goes wrong
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    next(error);
  }
}

module.exports = validateUploadFile;
