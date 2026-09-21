"use client";

import { useQuery } from "@tanstack/react-query";
import { tourService } from "@/services/tours";
import TourCard from "@/components/tours/TourCard";
import type { Tour } from "@/types";

/* ---------- Skeleton card ---------- */

function TourCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="aspect-4/3 w-full bg-gray-200" />
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

/* ---------- Inline error banner ---------- */

function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
          !
        </span>
        <div>
          <p className="font-medium text-red-800">Couldn&apos;t load tours</p>
          <p className="text-sm text-red-600">{message}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-700"
      >
        Try again
      </button>
    </div>
  );
}

/* ---------- Page ---------- */

export default function ToursPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["tours"],
    queryFn: () => tourService.getAll(),
    // Don't flip into an error state on a single failure if we have data
    // from a previous successful fetch — keep showing stale data.
    placeholderData: (previous) => previous,
  });

  const tours = (data?.data?.tours || []) as Tour[];
  const errorMessage =
    (error as { message?: string } | null)?.message ||
    "An unexpected error occurred.";

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      {/* ---------- Header ---------- */}
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            All Tours
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Handpicked adventures around the world
          </p>
        </div>

        {!isLoading && !isError && tours.length > 0 && (
          <span className="hidden text-sm text-gray-500 sm:inline">
            {tours.length} {tours.length === 1 ? "tour" : "tours"}
          </span>
        )}
      </div>

      {/* ---------- Error banner (non-blocking) ---------- */}
      {isError && (
        <div className="mb-6">
          <ErrorBanner message={errorMessage} onRetry={() => refetch()} />
        </div>
      )}

      {/* ---------- Loading skeletons ---------- */}
      {isLoading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <TourCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* ---------- Empty state ---------- */}
      {!isLoading && !isError && tours.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center">
          <span className="text-4xl">🧭</span>
          <h2 className="mt-3 text-lg font-semibold text-gray-800">
            No tours yet
          </h2>
          <p className="mt-1 max-w-md text-sm text-gray-500">
            We haven&apos;t published any tours. Check back soon or try a
            different filter.
          </p>
        </div>
      )}

      {/* ---------- Tours grid ---------- */}
      {!isLoading && tours.length > 0 && (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tours.map((tour) => (
              <TourCard key={tour._id} tour={tour} />
            ))}
          </div>

          {/* Subtle "refreshing" indicator when a background refetch runs */}
          {isFetching && (
            <p className="mt-6 text-center text-xs text-gray-400">
              Refreshing…
            </p>
          )}
        </>
      )}
    </div>
  );
}
