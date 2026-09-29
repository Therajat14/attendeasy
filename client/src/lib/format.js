// Puts a date into the browser's own style, for example "29 Sep 2026".
export function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Puts a date into the browser's own time style, for example "14:35".
export function formatTime(value) {
  return new Date(value).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// "Today" and "Yesterday" are friendlier than a full date, so we use them
// when the date is one of those, and fall back to the full date otherwise.
export function formatDayLabel(value) {
  const date = new Date(value);
  const today = new Date();

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return formatDate(date);
}

// Works out how long is left before a session closes.
//
// The result is a plain object, so the countdown in the UI can just read the
// pieces it needs: { totalMs, minutes, seconds, label, isUrgent }.
export function getRemainingTime(expiresAt, now = Date.now()) {
  const totalMs = new Date(expiresAt).getTime() - now;

  // Time is up, or it was never going to be enough.
  if (totalMs <= 0) {
    return { totalMs: 0, minutes: 0, seconds: 0, label: "Closed", isUrgent: false };
  }

  const totalSeconds = Math.floor(totalMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return {
    totalMs: totalMs,
    minutes: minutes,
    seconds: seconds,
    // "09:05" style, so the minutes and seconds are always two digits.
    label: `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
    // Under two minutes left, so the UI can show this in red.
    isUrgent: totalSeconds <= 120,
  };
}

// Puts a list of sessions into date buckets, so the history page can print one
// heading per day. Each result is { key, label, items }.
//
// The Map remembers the order keys were added in, so the days stay in the order
// they appeared in the list we were given.
export function groupByDate(items) {
  const groups = new Map();

  for (const item of items) {
    const key = new Date(item.date).toDateString();
    const existingItems = groups.get(key);

    if (existingItems) {
      existingItems.push(item);
    } else {
      // First session we see on this day, so we start a new bucket.
      groups.set(key, [item]);
    }
  }

  const result = [];

  for (const [key, groupedItems] of groups.entries()) {
    result.push({
      key: key,
      label: formatDayLabel(groupedItems[0].date),
      items: groupedItems,
    });
  }

  return result;
}

// Titles we never want to show, such as "Dr." or "Prof.".
const HONORIFICS = new Set([
  "dr",
  "dr.",
  "prof",
  "prof.",
  "mr",
  "mr.",
  "mrs",
  "mrs.",
  "ms",
  "ms.",
  "miss",
]);

// "2nd Year" becomes "Year 2".
export function formatYearOfStudy(value) {
  if (!value) {
    return "";
  }

  const digitsInText = value.match(/\d+/);

  if (digitsInText) {
    return `Year ${digitsInText[0]}`;
  }

  return value;
}

// "Dr. Ananya Iyer" becomes "Ananya", so we can greet someone by their real
// name. If we cannot do better, "there" is used as the fallback.
export function getShortName(name) {
  if (!name) {
    return "there";
  }

  const parts = name.trim().split(/\s+/);
  const namesWithoutTitles = [];

  for (const part of parts) {
    if (!HONORIFICS.has(part.toLowerCase())) {
      namesWithoutTitles.push(part);
    }
  }

  // Only the first name is used, and any trailing comma is dropped.
  const firstName = namesWithoutTitles[0] || parts[0] || "there";
  return firstName.replace(/[,]$/, "");
}

// "Aarav Sharma" becomes "AS". Used for the round avatar icons.
export function getInitials(name) {
  if (!name) {
    return "?";
  }

  const parts = name.split(" ").filter((part) => {
    return part.length > 0;
  });

  const letters = [];

  // Two letters is the most that fits in the circle.
  for (let index = 0; index < Math.min(2, parts.length); index++) {
    letters.push(parts[index].charAt(0).toUpperCase());
  }

  return letters.join("");
}

// "hello world" becomes "Hello World".
export function toTitleCase(value) {
  const words = value.split(" ");
  const capitalised = [];

  for (const word of words) {
    capitalised.push(word.charAt(0).toUpperCase() + word.slice(1));
  }

  return capitalised.join(" ");
}
