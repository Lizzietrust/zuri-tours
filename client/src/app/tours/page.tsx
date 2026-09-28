"use client";

import { useCallback, useMemo, useState } from "react";
import { useTours } from "@/hooks/useTours";
import TourCard from "@/components/tours/TourCard";
import TourFilters from "@/components/tours/TourFilters";
import ActiveFilterChips from "@/components/tours/ActiveFilterChips";
import type { Tour, TourFilters as Filters, TourQueryParams } from "@/types";

const DEFAULT_FILTERS: Filters = {
  q: "",
  difficulty: "",
  minPrice: "",
  maxPrice: "",
  minRating: "",
  maxDuration: "",
  category: "",
  sort: "-createdAt",
};

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

/** Convert UI filter state → API query params */
function toQueryParams(filters: Filters): TourQueryParams {
  const params: TourQueryParams = { sort: filters.sort };

  if (filters.q.trim()) params.q = filters.q.trim();
  if (filters.difficulty) params.difficulty = filters.difficulty;
  if (filters.category) params.category = filters.category;

  const min = Number(filters.minPrice);
  const max = Number(filters.maxPrice);
  if (filters.minPrice !== "" && Number.isFinite(min)) params.minPrice = min;
  if (filters.maxPrice !== "" && Number.isFinite(max)) params.maxPrice = max;

  const rating = Number(filters.minRating);
  if (filters.minRating !== "" && Number.isFinite(rating)) {
    params.minRating = rating;
  }

  const dur = Number(filters.maxDuration);
  if (filters.maxDuration !== "" && Number.isFinite(dur) && dur > 0) {
    params.maxDuration = dur;
  }

  return params;
}

/**
 * Client-side safety filter.
 *
 * The backend may not yet support every filter (e.g. `maxDuration` or
 * `minRating`) — this ensures the UI always respects the user's intent,
 * even when the API ignores a param. It also lets us search on fields
 * the backend's `q` might miss (e.g. location.city).
 *
 * If your backend eventually handles everything perfectly, you can
 * delete this and rely solely on server filtering.
 */
function applyClientFilters(tours: Tour[], filters: Filters): Tour[] {
  return tours.filter((tour) => {
    if (filters.q.trim()) {
      const needle = filters.q.trim().toLowerCase();
      const haystack = [
        tour.name,
        tour.summary,
        tour.description,
        tour.location?.address,
        tour.location?.city,
        tour.location?.country,
        tour.category,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(needle)) return false;
    }

    if (filters.difficulty && tour.difficulty !== filters.difficulty) {
      return false;
    }

    if (filters.category && tour.category !== filters.category) {
      return false;
    }

    if (filters.minPrice !== "") {
      const min = Number(filters.minPrice);
      if (Number.isFinite(min) && tour.price < min) return false;
    }

    if (filters.maxPrice !== "") {
      const max = Number(filters.maxPrice);
      if (Number.isFinite(max) && tour.price > max) return false;
    }

    if (filters.minRating !== "") {
      const min = Number(filters.minRating);
      if (Number.isFinite(min) && (tour.ratingsAverage ?? 0) < min)
        return false;
    }

    if (filters.maxDuration !== "") {
      const max = Number(filters.maxDuration);
      if (Number.isFinite(max) && tour.duration > max) return false;
    }

    return true;
  });
}

export default function ToursPage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const queryParams = useMemo(() => toQueryParams(filters), [filters]);

  const { data, isLoading, isError, error, refetch, isFetching } =
    useTours(queryParams);

  const rawTours = (data?.data?.tours || []) as Tour[];

  // Apply client-side safety filter so the UI is always correct.
  const tours = useMemo(
    () => applyClientFilters(rawTours, filters),
    [rawTours, filters],
  );

  const errorMessage =
    (error as { message?: string } | null)?.message ||
    "An unexpected error occurred.";

  const handleReset = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const serverCount = data?.total ?? rawTours.length;
  const showingCount = tours.length;
  const isFiltered =
    filters.q !== "" ||
    filters.difficulty !== "" ||
    filters.minPrice !== "" ||
    filters.maxPrice !== "" ||
    filters.minRating !== "" ||
    filters.maxDuration !== "" ||
    filters.category !== "";

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      {/* Header */}
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
            {showingCount} of {serverCount}{" "}
            {serverCount === 1 ? "tour" : "tours"}
          </span>
        )}
      </div>

      {isError && (
        <div className="mb-6">
          <ErrorBanner message={errorMessage} onRetry={() => refetch()} />
        </div>
      )}

      {/* Two-column layout: filters + results */}
      <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-8">
        {/* Sidebar */}
        <TourFilters
          filters={filters}
          onChange={setFilters}
          onReset={handleReset}
        />

        {/* Results */}
        <div className="mt-6 lg:mt-0">
          <ActiveFilterChips
            filters={filters}
            onChange={setFilters}
            onReset={handleReset}
          />

          {isLoading && (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <TourCardSkeleton key={i} />
              ))}
            </div>
          )}

          {!isLoading && !isError && tours.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center">
              <span className="text-4xl">{isFiltered ? "🔍" : "🧭"}</span>
              <h2 className="mt-3 text-lg font-semibold text-gray-800">
                {isFiltered ? "No tours match your filters" : "No tours yet"}
              </h2>
              <p className="mt-1 max-w-md text-sm text-gray-500">
                {isFiltered
                  ? "Try widening your price range, lowering the rating threshold, or clearing a filter."
                  : "We haven't published any tours. Check back soon."}
              </p>
              {isFiltered && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {!isLoading && tours.length > 0 && (
            <>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {tours.map((tour) => (
                  <TourCard key={tour._id} tour={tour} />
                ))}
              </div>
              {isFetching && (
                <p className="mt-6 text-center text-xs text-gray-400">
                  Refreshing…
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
