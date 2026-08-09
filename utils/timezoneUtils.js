// utils/dateUtils.js

function parseLocalDateTimeToUTC(dateTimeString, timeZone) {
  if (!dateTimeString || !timeZone) {
    return null;
  }

  // First make sure the supplied timezone is valid.
  try {
    new Intl.DateTimeFormat("en-US", {
      timeZone,
    }).format();
  } catch {
    return null;
  }

  // datetime-local gives us:
  // "2026-08-20T18:30"
  const [datePart, timePart] = dateTimeString.split("T");

  if (!datePart || !timePart) {
    return null;
  }

  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);

  if (!year || !month || !day || Number.isNaN(hour) || Number.isNaN(minute)) {
    return null;
  }

  // Start with the user's selected values as if they were UTC.
  const assumedUTC = new Date(Date.UTC(year, month - 1, day, hour, minute));

  // Determine how that instant is represented in the user's timezone.
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(assumedUTC);

  const values = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = Number(part.value);
    }
  }

  const timezoneAsUTC = Date.UTC(
    values.year,
    values.month - 1,
    values.day,
    values.hour,
    values.minute,
  );

  // Difference between the timezone's representation and UTC.
  const offset = timezoneAsUTC - assumedUTC.getTime();

  return new Date(assumedUTC.getTime() - offset);
}

module.exports = {
  parseLocalDateTimeToUTC,
};
