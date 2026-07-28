// Upload file validation is split between this middleware and validateUploadFile. Multer handles validation it already supports (file size and MIME type), allowing invalid uploads to be rejected before they are written to the uploads/ directory. validateUploadedFile.js handles additional validation that requires inspecting the uploaded file itself.

const multer = require("multer");
const { isAllowedMimeType } = require("../utils/mimeUtils");

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/");
  },

  filename(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// const upload = multer({ storage });
const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB
  },
  fileFilter(req, file, cb) {
    if (!isAllowedMimeType(file.mimetype)) {
      return cb(new Error("Unsupported file type."));
    }

    cb(null, true);
  },
});

module.exports = upload;
