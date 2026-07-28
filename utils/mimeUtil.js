const mimeLabels = {
  // Documents
  "application/pdf": "PDF Document",
  "application/msword": "Word Document (.doc)",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "Word Document (.docx)",
  "application/vnd.ms-excel": "Excel Spreadsheet (.xls)",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    "Excel Spreadsheet (.xlsx)",
  "application/vnd.ms-powerpoint": "PowerPoint Presentation (.ppt)",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    "PowerPoint Presentation (.pptx)",

  // OpenDocument
  "application/vnd.oasis.opendocument.text": "OpenDocument Text (.odt)",
  "application/vnd.oasis.opendocument.spreadsheet":
    "OpenDocument Spreadsheet (.ods)",
  "application/vnd.oasis.opendocument.presentation":
    "OpenDocument Presentation (.odp)",

  // Images
  "image/jpeg": "JPEG Image",
  "image/png": "PNG Image",
  "image/gif": "GIF Image",
  "image/webp": "WebP Image",
  "image/svg+xml": "SVG Image",
  "image/bmp": "Bitmap Image",
  "image/tiff": "TIFF Image",
  "image/x-icon": "Icon (.ico)",

  // Audio
  "audio/mpeg": "MP3 Audio",
  "audio/wav": "WAV Audio",
  "audio/ogg": "OGG Audio",
  "audio/flac": "FLAC Audio",
  "audio/aac": "AAC Audio",
  "audio/mp4": "M4A Audio",
  "audio/x-m4a": "M4A Audio",

  // Video
  "video/mp4": "MP4 Video",
  "video/webm": "WebM Video",
  "video/quicktime": "QuickTime Video (.mov)",
  "video/x-msvideo": "AVI Video",
  "video/x-matroska": "Matroska Video (.mkv)",

  // Text & Markup
  "text/plain": "Text File",
  "text/html": "HTML Document",
  "text/css": "CSS Stylesheet",
  "text/csv": "CSV File",
  "text/javascript": "JavaScript File",
  "application/json": "JSON File",
  "application/xml": "XML Document",
  "application/yaml": "YAML File",
  "application/x-yaml": "YAML File",

  // Archives
  "application/zip": "ZIP Archive",
  "application/x-zip-compressed": "ZIP Archive",
  "application/x-7z-compressed": "7-Zip Archive",
  "application/x-rar-compressed": "RAR Archive",
  "application/gzip": "GZip Archive",
  "application/x-tar": "TAR Archive",
};

const allowedMimeTypes = new Set(Object.keys(mimeLabels));

function formatMimeType(mimeType) {
  return mimeLabels[mimeType] ?? mimeType;
}

function isAllowedMimeType(mimeType) {
  return allowedMimeTypes.has(mimeType);
}

module.exports = {
  formatMimeType,
  isAllowedMimeType,
  allowedMimeTypes,
};
