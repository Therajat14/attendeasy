export function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(value: string | Date): string {
  return new Date(value).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDayLabel(value: string | Date): string {
  const date = new Date(value);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();

  if (isToday) return "Today";

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return formatDate(date);
}

export interface RemainingTime {
  totalMs: number;
  minutes: number;
  seconds: number;
  label: string;
  isUrgent: boolean;
}

export function getRemainingTime(expiresAt: string, now = Date.now()): RemainingTime {
  const totalMs = new Date(expiresAt).getTime() - now;

  if (totalMs <= 0) {
    return { totalMs: 0, minutes: 0, seconds: 0, label: "Closed", isUrgent: false };
  }

  const totalSeconds = Math.floor(totalMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return {
    totalMs,
    minutes,
    seconds,
    label: `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
    isUrgent: totalSeconds <= 120,
  };
}

export function groupByDate<T extends { date: string }>(
  items: T[],
): Array<{ key: string; label: string; items: T[] }> {
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const key = new Date(item.date).toDateString();
    const bucket = groups.get(key);

    if (bucket) {
      bucket.push(item);
      continue;
    }

    groups.set(key, [item]);
  }

  return Array.from(groups.entries()).map(([key, grouped]) => ({
    key,
    label: formatDayLabel(grouped[0].date),
    items: grouped,
  }));
}

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

export function formatYearOfStudy(value?: string): string {
  if (!value) return "";

  const yearNumber = value.match(/\d+/)?.[0];
  return yearNumber ? `Year ${yearNumber}` : value;
}

export function getShortName(name?: string): string {
  if (!name) return "there";

  const parts = name.trim().split(/\s+/);
  const withoutTitle = parts.filter((part) => !HONORIFICS.has(part.toLowerCase()));

  return (withoutTitle[0] || parts[0] || "there").replace(/[,]$/, "");
}

// "Aarav Sharma" becomes "AS". Used for the round avatar icons.
export function getInitials(name?: string): string {
  if (!name) return "?";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function toTitleCase(value: string): string {
  return value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
