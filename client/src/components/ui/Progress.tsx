import { ATTENDANCE_TONES } from "../../lib/attendance";
import type { Tone } from "../../lib/attendance";

interface ProgressProps {
  value: number;
  tone?: Tone;
  className?: string;
}

export default function Progress({
  value,
  tone = "brand",
  className = "",
}: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div
      className={`h-1.5 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800 ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-700 ease-out ${ATTENDANCE_TONES[tone]}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
