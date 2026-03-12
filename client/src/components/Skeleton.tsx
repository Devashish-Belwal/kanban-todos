export function BoardCardSkeleton() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5 animate-pulse">
      <div className="h-4 bg-white/10 rounded w-2/3 mb-3" />
      <div className="h-3 bg-white/5 rounded w-1/2 mb-6" />
      <div className="h-3 bg-white/5 rounded w-1/4" />
    </div>
  );
}

export function TaskCardSkeleton() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 animate-pulse">
      <div className="h-3 bg-white/10 rounded w-1/3 mb-3" />
      <div className="h-4 bg-white/10 rounded w-full mb-2" />
      <div className="h-3 bg-white/5 rounded w-2/3" />
    </div>
  );
}