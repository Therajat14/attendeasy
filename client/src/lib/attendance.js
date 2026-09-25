// Each attendance percentage gets a colour: green is healthy, red is a warning.
// The colour names are looked up in ATTENDANCE_TONES so Tailwind can see them.
export const ATTENDANCE_TONES = {
  brand: "bg-brand-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
};

export function attendanceTone(percentage) {
  if (percentage >= 85) return "success";
  if (percentage >= 75) return "brand";
  if (percentage >= 65) return "warning";
  return "danger";
}
