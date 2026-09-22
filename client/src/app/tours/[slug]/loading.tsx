import Skeleton from "@/components/ui/Skeleton";

export default function TourLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <Skeleton className="h-8 w-48" />

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
          <Skeleton className="mt-6 h-6 w-2/3" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-5/6" />
          <Skeleton className="mt-8 h-32 w-full rounded-2xl" />
        </div>

        <aside>
          <Skeleton className="h-64 w-full rounded-2xl" />
        </aside>
      </div>
    </div>
  );
}
