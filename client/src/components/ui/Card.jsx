export function Card({ children, className = "", padded = true }) {
  return (
    <section
      className={`min-w-0 rounded-2xl border border-ink-200/80 bg-white shadow-soft transition dark:border-ink-800 dark:bg-ink-900 dark:shadow-none ${padded ? "p-5 sm:p-6" : ""} ${className}`}
    >
      {children}
    </section>
  );
}

export function CardHeader({ title, description, action, icon, className = "" }) {
  return (
    <div className={`flex flex-wrap items-start justify-between gap-4 ${className}`}>
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold text-ink-900 dark:text-white">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-[13px] leading-relaxed text-ink-500 dark:text-ink-400">
              {description}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// `tone` decides the little icon chip colour.
// Valid names: default, brand, success, warning.
const tones = {
  default: "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300",
  brand: "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300",
  success:
    "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
  warning: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
};

export function StatCard({ label, value, hint, icon, tone = "default" }) {
  return (
    <div className="rounded-2xl border border-ink-200/80 bg-white p-4 shadow-soft sm:p-5 dark:border-ink-800 dark:bg-ink-900 dark:shadow-none">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] font-semibold tracking-wide text-ink-500 uppercase dark:text-ink-400">
          {label}
        </p>
        {icon && (
          <span
            className={`flex size-8 items-center justify-center rounded-lg ${tones[tone]}`}
          >
            {icon}
          </span>
        )}
      </div>
      <p className="mt-2.5 font-display text-2xl font-bold text-ink-900 sm:text-[28px] dark:text-white">
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-500 dark:text-ink-400">
          {hint}
        </p>
      )}
    </div>
  );
}
