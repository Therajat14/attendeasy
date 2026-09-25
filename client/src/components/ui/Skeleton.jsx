export function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-ink-100 dark:bg-ink-800 ${className}`}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-ink-200/80 bg-white p-5 dark:border-ink-800 dark:bg-ink-900/70">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-4 h-8 w-20" />
      <Skeleton className="mt-4 h-3 w-full" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 border-t border-ink-100 px-4 py-3.5 dark:border-ink-800">
      <Skeleton className="size-9 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-3 w-1/5" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}
