export function RouteLoadingFallback() {
  return (
    <div className="flex flex-col gap-5 py-2" role="status" aria-label="Loading">
      <div className="flex items-center justify-between">
        <div className="skeleton h-6 w-40" />
        <div className="skeleton h-9 w-24 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-16" style={{ animationDelay: `${i * 60}ms` }} />
        ))}
      </div>
      <div className="flex flex-col gap-2.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-14" style={{ animationDelay: `${i * 60}ms` }} />
        ))}
      </div>
    </div>
  );
}
