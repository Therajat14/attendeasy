import { getInitials } from "../../lib/format";

const palette = [
  "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
  "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200",
  "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
  "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200",
];

function pick(name: string): string {
  const total = Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palette[total % palette.length];
}

interface AvatarProps {
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "size-8 text-[11px]",
  md: "size-10 text-[13px]",
  lg: "size-12 text-base",
};

export default function Avatar({ name, size = "md", className = "" }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold ${sizes[size]} ${pick(name || "?")} ${className}`}
    >
      {getInitials(name)}
    </span>
  );
}
