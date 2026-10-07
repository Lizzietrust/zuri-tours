"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useTours } from "@/hooks/useTours";
import TourCard from "@/components/tours/TourCard";
import TourCardSkeleton from "@/components/tours/TourCardSkeleton";
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

const EMPTY_TOURS: Tour[] = [];

function toQueryParams(filters: Filters): TourQueryParams {
  const params: TourQueryParams = { sort: filters.sort };

  if (filters.q.trim()) params.q = filters.q.trim();
  if (filters.difficulty) params.difficulty = filters.difficulty;
  if (filters.category) params.category = filters.category;

  if (filters.minPrice !== "") {
    const n = Number(filters.minPrice);
    if (Number.isFinite(n)) params.minPrice = n;
  }
  if (filters.maxPrice !== "") {
    const n = Number(filters.maxPrice);
    if (Number.isFinite(n)) params.maxPrice = n;
  }
  if (filters.minRating !== "") {
    const n = Number(filters.minRating);
    if (Number.isFinite(n)) params.minRating = n;
  }
  if (filters.maxDuration !== "") {
    const n = Number(filters.maxDuration);
    if (Number.isFinite(n) && n > 0) params.maxDuration = n;
  }

  return params;
}

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

    if (filters.difficulty && tour.difficulty !== filters.difficulty)
      return false;
    if (filters.category && tour.category !== filters.category) return false;

    if (filters.minPrice !== "") {
      const n = Number(filters.minPrice);
      if (Number.isFinite(n) && tour.price < n) return false;
    }
    if (filters.maxPrice !== "") {
      const n = Number(filters.maxPrice);
      if (Number.isFinite(n) && tour.price > n) return false;
    }
    if (filters.minRating !== "") {
      const n = Number(filters.minRating);
      if (Number.isFinite(n) && (tour.ratingsAverage ?? 0) < n) return false;
    }
    if (filters.maxDuration !== "") {
      const n = Number(filters.maxDuration);
      if (Number.isFinite(n) && tour.duration > n) return false;
    }

    return true;
  });
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
        <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold text-red-600">
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

export default function ToursPage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const queryParams = useMemo(() => toQueryParams(filters), [filters]);
  const { data, isLoading, isError, error, refetch, isFetching } =
    useTours(queryParams);

  const rawTours = useMemo<Tour[]>(
    () => (data?.data?.tours ?? EMPTY_TOURS) as Tour[],
    [data],
  );

  const tours = useMemo(
    () => applyClientFilters(rawTours, filters),
    [rawTours, filters],
  );

  const errorMessage =
    (error as { message?: string } | null)?.message ||
    "An unexpected error occurred.";

  const handleReset = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const serverTotal = data?.total ?? rawTours.length;
  const showingOnPage = tours.length;
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
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            All Tours
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Handpicked adventures around the world
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isLoading && !isError && tours.length > 0 && (
            <span className="hidden text-sm text-gray-500 sm:inline">
              {showingOnPage} on this page · {serverTotal} total
            </span>
          )}
          <Link
            href="/tours/near-me"
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
          >
            📍 Near me
          </Link>
        </div>
      </div>

      {isError && (
        <div className="mb-6">
          <ErrorBanner message={errorMessage} onRetry={() => refetch()} />
        </div>
      )}

      <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-8">
        <TourFilters
          filters={filters}
          onChange={setFilters}
          onReset={handleReset}
        />

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
