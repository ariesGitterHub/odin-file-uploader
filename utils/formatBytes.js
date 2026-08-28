function formatBytes(bytes) {
  if (bytes === 0n) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];

  let i = 0;
  let num = Number(bytes);

  while (num >= k && i < sizes.length - 1) {
    num /= k;
    i++;
  }

  // return `${num.toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
  const decimals = i === 0 || Number.isInteger(num) ? 0 : 1;

  return `${num.toFixed(decimals)} ${sizes[i]}`;
}

module.exports = { formatBytes };
