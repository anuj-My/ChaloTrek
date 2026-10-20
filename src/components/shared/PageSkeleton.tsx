// Fallback while a page waits on the session or data.
export function PageSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      <div className="h-7 w-48 animate-pulse rounded-md bg-muted" />
      <div className="h-4 w-80 max-w-full animate-pulse rounded-md bg-muted" />
    </div>
  );
}
