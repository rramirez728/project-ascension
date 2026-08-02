/** Loading skeleton placeholder. */
export function Skeleton({ className = '', width, height }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-border/40 ${className}`}
      style={{ width, height }}
    />
  );
}

/** Skeleton card for dashboard loading state. */
export function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-surface border border-border p-6 shadow-card space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-full" />
    </div>
  );
}
