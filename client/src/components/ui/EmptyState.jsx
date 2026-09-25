export default function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-ink-50/50 text-center dark:border-ink-700 dark:bg-ink-800/30 ${
        compact ? "px-5 py-8" : "px-6 py-14"
      }`}
    >
      <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-ink-400 shadow-soft dark:bg-ink-900 dark:text-ink-500">
        {icon}
      </span>
      <h3 className="mt-4 text-[15px] font-bold text-ink-900 dark:text-white">
        {title}
      </h3>
      <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-ink-500 dark:text-ink-400">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
