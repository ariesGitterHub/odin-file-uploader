// This is just a config file for storage limits

function getPositiveNumber(name) {
  const value = Number(process.env[name]);

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number`);
  }

  return value;
}

module.exports = {
  fileSizeLimitMB: getPositiveNumber("MAX_FILE_DOWNLOAD_KB"),
  // userSizeLimitGB: getPositiveNumber("MAX_USER_STORAGE_GB"), // Changed to MB since cloud storage free limit is 1GB
  userSizeLimitMB: getPositiveNumber("MAX_USER_STORAGE_MB"), 
};