// `eyebrow` is the small grey line above the title, for example "Overview".
// `actions` is anything placed on the right, usually buttons.
export default function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 text-[11.5px] font-bold tracking-wider text-brand-600 uppercase dark:text-brand-400">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-[22px] leading-tight font-extrabold text-ink-900 sm:text-[26px] dark:text-white">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-ink-500 dark:text-ink-400">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
