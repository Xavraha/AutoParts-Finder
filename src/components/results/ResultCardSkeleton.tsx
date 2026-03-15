export function ResultCardSkeleton() {
  return (
    <div className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4">
      <div className="h-24 w-24 shrink-0 animate-pulse rounded-lg bg-gray-200" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
        <div className="h-6 w-24 animate-pulse rounded bg-gray-200" />
        <div className="mt-auto flex gap-2">
          <div className="h-5 w-16 animate-pulse rounded-full bg-gray-200" />
          <div className="h-5 w-20 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
