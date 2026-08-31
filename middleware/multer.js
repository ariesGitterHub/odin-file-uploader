// Upload file validation is split between this middleware and validateUploadFile. Multer handles validation it already supports (file size and MIME type), allowing invalid uploads to be rejected before they are written to the uploads/ directory. validateUploadedFile.js handles additional validation that requires inspecting the uploaded file itself.

const path = require("path");
const multer = require("multer");
const { isAllowedMimeType } = require("../utils/mimeUtils");
const { 
  fileSizeLimitMB, 
  // userSizeLimitGB,
 } = require("../config/sizeLimits"); // This populates the config for fileSizeLimit


// TODO - maybe move this sanitizeFilename into utils/ later
function sanitizeFilename(filename) {
  const extension = path.extname(filename);
  const basename = path.basename(filename, extension);

  const safeName = basename
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();

  return `${safeName}${extension.toLowerCase()}`;
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/");
  },

  // filename(req, file, cb) {
  //   cb(null, `${Date.now()}-${file.originalname}`);
  // },

  filename(req, file, cb) {
    const safeFilename = sanitizeFilename(file.originalname);

    cb(null, `${Date.now()}-${safeFilename}`);
  },
});

// const upload = multer({ storage });
const upload = multer({
  storage,
  limits: {
    fileSize: fileSizeLimitMB * 1024 * 1024, 
  },
  fileFilter(req, file, cb) {
    if (!isAllowedMimeType(file.mimetype)) {
      const error = new Error("Unsupported file type.");
      // error.status = 400;
      error.code = "INVALID_MIME_TYPE";

      return cb(error);
    }

    cb(null, true);
  },
});

module.exports = upload;
