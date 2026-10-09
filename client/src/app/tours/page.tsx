"use client";

import { Suspense, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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

const FILTER_KEYS = Object.keys(DEFAULT_FILTERS) as (keyof Filters)[];

const EMPTY_TOURS: Tour[] = [];

/* ---------- URL <-> filters ---------- */

function parseFilters(search: string): Filters {
  const sp = new URLSearchParams(search);
  const next: Filters = { ...DEFAULT_FILTERS };
  for (const key of FILTER_KEYS) {
    const value = sp.get(key);
    if (value !== null) next[key] = value;
  }
  return next;
}

function toSearchString(filters: Filters): string {
  const sp = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = filters[key];
    if (value !== "" && value !== DEFAULT_FILTERS[key]) sp.set(key, value);
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

/* ---------- Filters -> API params ---------- */

function toQueryParams(filters: Filters): TourQueryParams {
  const params: TourQueryParams = { sort: filters.sort };

  if (filters.q.trim()) params.q = filters.q.trim();
  if (filters.difficulty) params.difficulty = filters.difficulty;
  if (filters.category) params.category = filters.category;

  const num = (v: string) =>
    v !== "" && Number.isFinite(Number(v)) ? Number(v) : undefined;

  const minPrice = num(filters.minPrice);
  const maxPrice = num(filters.maxPrice);
  const minRating = num(filters.minRating);
  const maxDuration = num(filters.maxDuration);

  if (minPrice !== undefined) params.minPrice = minPrice;
  if (maxPrice !== undefined) params.maxPrice = maxPrice;
  if (minRating !== undefined) params.minRating = minRating;
  if (maxDuration !== undefined && maxDuration > 0)
    params.maxDuration = maxDuration;

  return params;
}

/**
 * Safety net for filters the backend list endpoint doesn't apply
 * (category and maxDuration aren't handled by getAllTours).
 * NOTE: `q` is intentionally NOT filtered here — the server does the search.
 */
function applyClientFilters(tours: Tour[], filters: Filters): Tour[] {
  return tours.filter((tour) => {
    if (filters.difficulty && tour.difficulty !== filters.difficulty)
      return false;
    if (filters.category && tour.category !== filters.category) return false;

    const minPrice = Number(filters.minPrice);
    if (
      filters.minPrice !== "" &&
      Number.isFinite(minPrice) &&
      tour.price < minPrice
    )
      return false;

    const maxPrice = Number(filters.maxPrice);
    if (
      filters.maxPrice !== "" &&
      Number.isFinite(maxPrice) &&
      tour.price > maxPrice
    )
      return false;

    const minRating = Number(filters.minRating);
    if (
      filters.minRating !== "" &&
      Number.isFinite(minRating) &&
      (tour.ratingsAverage ?? 0) < minRating
    )
      return false;

    const maxDuration = Number(filters.maxDuration);
    if (
      filters.maxDuration !== "" &&
      Number.isFinite(maxDuration) &&
      tour.duration > maxDuration
    )
      return false;

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
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
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

function ToursContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  const filters = useMemo(() => parseFilters(search), [search]);

  const setFilters = useCallback(
    (next: Filters) => {
      router.replace(`/tours${toSearchString(next)}`, { scroll: false });
    },
    [router],
  );

  const handleReset = useCallback(() => {
    router.replace("/tours", { scroll: false });
  }, [router]);

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

  const serverTotal = data?.total ?? rawTours.length;
  const isFiltered = FILTER_KEYS.some((k) => k !== "sort" && filters[k] !== "");

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {filters.q ? (
              <>
                Results for{" "}
                <span className="text-emerald-700">
                  &ldquo;{filters.q}&rdquo;
                </span>
              </>
            ) : (
              "All Tours"
            )}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {filters.q
              ? `${tours.length} ${tours.length === 1 ? "tour" : "tours"} found`
              : "Handpicked adventures around the world"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isLoading && !isError && tours.length > 0 && !filters.q && (
            <span className="hidden text-sm text-gray-500 sm:inline">
              {tours.length} on this page · {serverTotal} total
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
            <div
              className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
              aria-busy="true"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <TourCardSkeleton key={i} />
              ))}
            </div>
          )}

          {!isLoading && !isError && tours.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center">
              <span className="text-4xl" aria-hidden>
                {isFiltered ? "🔍" : "🧭"}
              </span>
              <h2 className="mt-3 text-lg font-semibold text-gray-800">
                {filters.q
                  ? `No tours found for “${filters.q}”`
                  : isFiltered
                    ? "No tours match your filters"
                    : "No tours yet"}
              </h2>
              <p className="mt-1 max-w-md text-sm text-gray-500">
                {isFiltered
                  ? "Try a different keyword, widen your price range, or clear a filter."
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
                <p
                  className="mt-6 text-center text-xs text-gray-400"
                  role="status"
                >
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

export default function ToursPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <TourCardSkeleton key={i} />
            ))}
          </div>
        </div>
      }
    >
      <ToursContent />
    </Suspense>
  );
}
