import type { ReactNode } from "react";

interface AlertProps {
  children: ReactNode;
  tone?: "danger" | "warning" | "info" | "success";
  title?: string;
  icon?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

const tones: Record<NonNullable<AlertProps["tone"]>, { wrap: string; icon: string }> = {
  danger: {
    wrap: "border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200",
    icon: "text-red-500 dark:text-red-400",
  },
  warning: {
    wrap: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
    icon: "text-amber-500 dark:text-amber-400",
  },
  info: {
    wrap: "border-brand-200 bg-brand-50 text-brand-900 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-200",
    icon: "text-brand-500 dark:text-brand-400",
  },
  success: {
    wrap: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200",
    icon: "text-emerald-500 dark:text-emerald-400",
  },
};

export default function Alert({
  children,
  tone = "danger",
  title,
  icon,
  onDismiss,
  className = "",
}: AlertProps) {
  const palette = tones[tone];

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-[13px] leading-relaxed ${palette.wrap} ${className}`}
    >
      {icon && <span className={`mt-0.5 shrink-0 ${palette.icon}`}>{icon}</span>}
      <div className="min-w-0 flex-1">
        {title && <p className="font-bold">{title}</p>}
        <div className={title ? "mt-0.5 opacity-90" : "font-medium"}>{children}</div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded-md px-1 text-lg leading-none opacity-60 transition hover:opacity-100"
        >
          &times;
        </button>
      )}
    </div>
  );
}
