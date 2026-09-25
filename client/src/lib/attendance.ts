export type Tone = "brand" | "success" | "warning" | "danger";

export const ATTENDANCE_TONES: Record<Tone, string> = {
  brand: "bg-brand-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
};

export function attendanceTone(percentage: number): Tone {
  if (percentage >= 85) return "success";
  if (percentage >= 75) return "brand";
  if (percentage >= 65) return "warning";
  return "danger";
}
