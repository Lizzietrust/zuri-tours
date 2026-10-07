export default function TourCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="aspect-4/3 w-full bg-linear-to-br from-gray-100 to-gray-200" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-2/3 rounded bg-gray-200" />
        <div className="h-3 w-full rounded bg-gray-200" />
        <div className="h-3 w-4/5 rounded bg-gray-200" />
        <div className="flex items-center justify-between pt-2">
          <div className="h-5 w-16 rounded bg-gray-200" />
          <div className="h-6 w-20 rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
