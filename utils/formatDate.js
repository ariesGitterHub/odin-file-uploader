// import { formatDistanceToNow, format } from "date-fns";
const { format, formatDistanceToNow } = require("date-fns");

// NOTE - formatRelativeDate not used in ths app now
function formatRelativeDate(date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

function formatExactDate(date) {
  // Below should only affect expiresAt and lastAccessedAt dates, which may be null, as createdAt are never null, and the updatedAt date will always, at least, mirror createdAt until an update occurs
  if (!date) {
    return "Never"
  } else {
  return format(new Date(date), "MMM d, yyyy h:mm a");  
  }
}

module.exports = { formatRelativeDate, formatExactDate };