// import { formatDistanceToNow, format } from "date-fns";
const { format, formatDistanceToNow } = require("date-fns");

// NOTE - formatRelativeDate not used
function formatRelativeDate(date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

function formatExactDate(date) {
  return format(new Date(date), "MMM d, yyyy h:mm a");
}

module.exports = { formatRelativeDate, formatExactDate };