export function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-6 p-4 md:p-6">
      <div className="space-y-2">
        <div className="h-6 w-48 rounded bg-neutral-200" />
        <div className="h-4 w-72 rounded bg-neutral-100" />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg border border-neutral-200 bg-neutral-100" />
        ))}
      </div>

      <div className="h-72 rounded-lg border border-neutral-200 bg-neutral-100" />

      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 rounded bg-neutral-100" />
        ))}
      </div>
    </div>
  );
}
