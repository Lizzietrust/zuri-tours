export default function TourCardSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading tour"
      className="flex h-full animate-pulse flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
    >
      <div className="aspect-4/3 w-full bg-linear-to-br from-gray-100 to-gray-200" />
      <div className="flex flex-1 flex-col p-4">
        {/* title */}
        <div className="h-5 w-4/5 rounded bg-gray-200" />
        <div className="mt-2 h-5 w-1/2 rounded bg-gray-200" />
        {/* stars */}
        <div className="mt-3 h-3.5 w-28 rounded bg-gray-200" />
        {/* summary */}
        <div className="mt-4 space-y-2">
          <div className="h-3 w-full rounded bg-gray-200" />
          <div className="h-3 w-4/5 rounded bg-gray-200" />
        </div>
        {/* meta */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="h-3 w-20 rounded bg-gray-200" />
          <div className="h-3 w-16 rounded bg-gray-200" />
        </div>
        {/* price + cta */}
        <div className="mt-auto flex items-end justify-between border-t border-gray-100 pt-4">
          <div className="h-6 w-20 rounded bg-gray-200" />
          <div className="h-7 w-24 rounded-lg bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
