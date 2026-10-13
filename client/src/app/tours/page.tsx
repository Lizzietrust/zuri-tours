"use client";

import {
  Suspense,
  useCallback,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTours, useToursByLocation } from "@/hooks/useTours";
import TourCard from "@/components/tours/TourCard";
import TourCardSkeleton from "@/components/tours/TourCardSkeleton";
import TourFilters from "@/components/tours/TourFilters";
import ActiveFilterChips from "@/components/tours/ActiveFilterChips";
import Pagination from "@/components/ui/Pagination";
import type { Tour, TourFilters as Filters, TourQueryParams } from "@/types";

const PAGE_SIZE = 9;
const LOCATION_RADIUS = 100;

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

const CATEGORIES = [
  { value: "", label: "All", icon: "🌍" },
  { value: "adventure", label: "Adventure", icon: "🧗" },
  { value: "cultural", label: "Cultural", icon: "🏛️" },
  { value: "nature", label: "Nature", icon: "🌿" },
  { value: "city", label: "City", icon: "🏙️" },
  { value: "beach", label: "Beach", icon: "🏖️" },
  { value: "mountain", label: "Mountain", icon: "⛰️" },
];

const SORTS = [
  { value: "-createdAt", label: "Newest first" },
  { value: "price", label: "Price: low → high" },
  { value: "-price", label: "Price: high → low" },
  { value: "-ratingsAverage", label: "Highest rated" },
  { value: "duration", label: "Shortest duration" },
  { value: "-duration", label: "Longest duration" },
  { value: "name", label: "Name A → Z" },
];

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

function parsePage(search: string): number {
  const n = parseInt(new URLSearchParams(search).get("page") ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function parseLocation(search: string): string {
  return new URLSearchParams(search).get("location") ?? "";
}

function buildUrl(filters: Filters, page = 1, location = ""): string {
  const sp = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = filters[key];
    if (value !== "" && value !== DEFAULT_FILTERS[key]) sp.set(key, value);
  }
  if (location) sp.set("location", location);
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `/tours?${qs}` : "/tours";
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

/** Same filters, but shaped for the nearby/geo endpoint. */
function toNearbyParams(filters: Filters, page: number) {
  const num = (v: string) =>
    v !== "" && Number.isFinite(Number(v)) ? Number(v) : undefined;

  return {
    radius: LOCATION_RADIUS,
    difficulty: filters.difficulty || undefined,
    category: filters.category || undefined,
    minPrice: num(filters.minPrice),
    maxPrice: num(filters.maxPrice),
    minRating: num(filters.minRating),
    maxDuration: num(filters.maxDuration),
    sortBy: (["price", "ratingsAverage", "duration"].includes(filters.sort)
      ? filters.sort
      : "distance") as "distance" | "price" | "ratingsAverage" | "duration",
    page,
    limit: PAGE_SIZE,
  };
}

/** Safety net for filters the backend list endpoint may not apply. */
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

/* ---------- Small UI pieces ---------- */

function SearchBar({
  initialQ,
  initialLocation,
  onSearch,
}: {
  initialQ: string;
  initialLocation: string;
  onSearch: (q: string, location: string) => void;
}) {
  const [q, setQ] = useState(initialQ);
  const [loc, setLoc] = useState(initialLocation);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSearch(q.trim(), loc.trim());
  };

  return (
    <form
      onSubmit={submit}
      role="search"
      className="mx-auto mt-8 flex max-w-2xl flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-lg shadow-emerald-900/5 focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100 sm:flex-row sm:items-center"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 px-2">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          className="h-5 w-5 shrink-0 text-gray-400"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <label htmlFor="tours-search" className="sr-only">
          Search tours
        </label>
        <input
          id="tours-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tours, destinations…"
          className="min-w-0 flex-1 bg-transparent py-2 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none"
        />
      </div>

      <div className="hidden h-8 w-px bg-gray-200 sm:block" />

      <div className="flex min-w-0 flex-1 items-center gap-2 px-2">
        <span aria-hidden className="text-gray-400">
          📍
        </span>
        <label htmlFor="tours-location" className="sr-only">
          Near location
        </label>
        <input
          id="tours-location"
          type="text"
          value={loc}
          onChange={(e) => setLoc(e.target.value)}
          placeholder="Near… (e.g. Nairobi, Paris)"
          className="min-w-0 flex-1 bg-transparent py-2 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none"
        />
        {loc && (
          <button
            type="button"
            onClick={() => setLoc("")}
            aria-label="Clear location"
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      <button
        type="submit"
        className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
      >
        Search
      </button>
    </form>
  );
}

/* ---------- Page ---------- */

function ToursContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const resultsRef = useRef<HTMLDivElement>(null);

  const filters = useMemo(() => parseFilters(search), [search]);
  const page = useMemo(() => parsePage(search), [search]);
  const locationQuery = useMemo(() => parseLocation(search), [search]);

  const isLocationMode = locationQuery.trim().length >= 2;

  const setFilters = useCallback(
    (next: Filters) =>
      router.replace(buildUrl(next, 1, locationQuery), { scroll: false }),
    [router, locationQuery],
  );

  const setLocation = useCallback(
    (next: string) =>
      router.replace(buildUrl(filters, 1, next.trim()), { scroll: false }),
    [router, filters],
  );

  const handleReset = useCallback(
    () => router.replace("/tours", { scroll: false }),
    [router],
  );

  const handleSearch = useCallback(
    (q: string, loc: string) =>
      router.replace(buildUrl({ ...filters, q }, 1, loc), { scroll: false }),
    [router, filters],
  );

  const goToPage = useCallback(
    (p: number) => {
      router.replace(buildUrl(filters, p, locationQuery), { scroll: false });
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    },
    [router, filters, locationQuery],
  );

  /* ---------- Data: geo mode vs list mode ---------- */

  const listParams = useMemo<TourQueryParams>(
    () => ({ ...toQueryParams(filters), page, limit: PAGE_SIZE }),
    [filters, page],
  );

  const nearbyParams = useMemo(
    () => toNearbyParams(filters, page),
    [filters, page],
  );

  const listQuery = useTours(listParams, { enabled: !isLocationMode });
  const geoQuery = useToursByLocation(
    isLocationMode ? locationQuery : "",
    nearbyParams,
  );

  const activeQuery = isLocationMode ? geoQuery : listQuery;

  const rawTours = useMemo<Tour[]>(() => {
    if (isLocationMode) return (geoQuery.data?.tours ?? EMPTY_TOURS) as Tour[];
    return (listQuery.data?.data?.tours ?? EMPTY_TOURS) as Tour[];
  }, [isLocationMode, geoQuery.data, listQuery.data]);

  const tours = useMemo(
    () => applyClientFilters(rawTours, filters),
    [rawTours, filters],
  );

  const total = isLocationMode
    ? (geoQuery.data?.total ?? rawTours.length)
    : (listQuery.data?.total ?? rawTours.length);

  const pages = isLocationMode
    ? (geoQuery.data?.pages ?? 1)
    : (listQuery.data?.pages ?? 1);

  const isLoading = activeQuery.isLoading;
  const isError = activeQuery.isError;
  const isFetching = activeQuery.isFetching;

  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  const errorMessage =
    (activeQuery.error as { message?: string } | null)?.message ||
    "An unexpected error occurred.";

  const isFiltered = FILTER_KEYS.some((k) => k !== "sort" && filters[k] !== "");

  const geoCenter = geoQuery.data?.center;

  /* ✅ FIX — only build the coordinate label when both lat/lng are finite numbers */
  const geoCenterLabel =
    geoCenter &&
    Number.isFinite(geoCenter.lat) &&
    Number.isFinite(geoCenter.lng)
      ? `(${geoCenter.lat.toFixed(3)}, ${geoCenter.lng.toFixed(3)})`
      : null;

  return (
    <div className="min-h-screen">
      {/* ============================ HERO ============================ */}
      <section className="relative overflow-hidden bg-linear-to-br from-emerald-50 via-white to-sky-50">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-emerald-200/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-sky-200/40 blur-3xl"
        />

        <div className="relative mx-auto max-w-5xl px-6 py-14 text-center sm:py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-3 py-1 text-xs font-medium text-emerald-800 backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 motion-safe:animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            New tours added weekly
          </span>

          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-balance text-gray-900 sm:text-5xl">
            {locationQuery ? (
              <>
                Tours near{" "}
                <span className="bg-linear-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent">
                  {locationQuery}
                </span>
              </>
            ) : filters.q ? (
              <>
                Results for{" "}
                <span className="bg-linear-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent">
                  &ldquo;{filters.q}&rdquo;
                </span>
              </>
            ) : (
              <>
                Find your next{" "}
                <span className="bg-linear-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent">
                  adventure
                </span>
              </>
            )}
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-lg text-pretty text-gray-600">
            Handpicked tours around the world — search by destination, or add a
            location to sort by distance.
          </p>

          <SearchBar
            key={`${filters.q}|${locationQuery}`}
            initialQ={filters.q}
            initialLocation={locationQuery}
            onSearch={handleSearch}
          />

          {/* Category quick filters */}
          <div
            className="mt-6 flex flex-wrap justify-center gap-2"
            role="group"
            aria-label="Filter by category"
          >
            {CATEGORIES.map((c) => {
              const active = filters.category === c.value;
              return (
                <button
                  key={c.value || "all"}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilters({ ...filters, category: c.value })}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
                    active
                      ? "border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                      : "border-gray-200 bg-white/80 text-gray-700 backdrop-blur hover:border-emerald-300 hover:bg-emerald-50"
                  }`}
                >
                  <span aria-hidden>{c.icon}</span>
                  {c.label}
                </button>
              );
            })}
          </div>

          {/* Active location pill */}
          {isLocationMode && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => setLocation("")}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-emerald-800 backdrop-blur hover:bg-emerald-50"
              >
                📍 Near: {locationQuery}
                {/* ✅ FIX — use the precomputed safe label */}
                {geoCenterLabel && (
                  <span className="text-emerald-600/70">{geoCenterLabel}</span>
                )}
                <span aria-hidden>✕</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ========================== RESULTS ========================== */}
      <section className="border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-8">
            <TourFilters
              filters={filters}
              onChange={setFilters}
              onReset={handleReset}
            />

            <div ref={resultsRef} className="mt-6 scroll-mt-24 lg:mt-0">
              {/* Toolbar */}
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-gray-600" aria-live="polite">
                  {isLoading
                    ? isLocationMode
                      ? `Finding tours near ${locationQuery}…`
                      : "Loading tours…"
                    : tours.length > 0
                      ? `Showing ${from}–${to} of ${total} ${total === 1 ? "tour" : "tours"}`
                      : ""}
                </p>

                <div className="flex items-center gap-2">
                  <Link
                    href="/tours/near-me"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                  >
                    📍 Near me
                  </Link>
                  <label htmlFor="sort" className="sr-only">
                    Sort tours
                  </label>
                  <select
                    id="sort"
                    value={filters.sort}
                    onChange={(e) =>
                      setFilters({ ...filters, sort: e.target.value })
                    }
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                  >
                    {SORTS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <ActiveFilterChips
                filters={filters}
                onChange={setFilters}
                onReset={handleReset}
              />

              {isError && (
                <div
                  role="alert"
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800"
                >
                  <span>
                    <span className="font-semibold">
                      {isLocationMode
                        ? `We couldn't find tours near "${locationQuery}".`
                        : "We couldn't load tours right now."}
                    </span>{" "}
                    {errorMessage}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => activeQuery.refetch()}
                      className="rounded-lg bg-amber-600 px-3 py-1.5 font-semibold text-white hover:bg-amber-700"
                    >
                      Try again
                    </button>
                    {isLocationMode && (
                      <button
                        type="button"
                        onClick={() => setLocation("")}
                        className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 font-semibold text-amber-800 hover:bg-amber-50"
                      >
                        Clear location
                      </button>
                    )}
                  </div>
                </div>
              )}

              {isLoading && (
                <div
                  className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
                  aria-busy="true"
                >
                  {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                    <TourCardSkeleton key={i} />
                  ))}
                </div>
              )}

              {!isLoading && !isError && tours.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
                  <span className="text-4xl" aria-hidden>
                    {isLocationMode ? "🗺️" : isFiltered ? "🔍" : "🧭"}
                  </span>
                  <h2 className="mt-3 text-lg font-semibold text-gray-900">
                    {isLocationMode
                      ? `No tours within ${LOCATION_RADIUS} km of ${locationQuery}`
                      : filters.q
                        ? `No tours found for "${filters.q}"`
                        : isFiltered
                          ? "No tours match your filters"
                          : "No tours yet"}
                  </h2>
                  <p className="mt-1 max-w-md text-sm text-gray-600">
                    {isLocationMode
                      ? "Try a different city, or widen your filters."
                      : isFiltered
                        ? "Try a different keyword, widen your price range, or clear a filter."
                        : "We haven't published any tours. Check back soon."}
                  </p>
                  {(isFiltered || isLocationMode) && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              )}

              {!isLoading && tours.length > 0 && (
                <div
                  className={`grid gap-6 transition-opacity sm:grid-cols-2 xl:grid-cols-3 ${
                    isFetching ? "opacity-60" : "opacity-100"
                  }`}
                >
                  {tours.map((tour) => (
                    <TourCard key={tour._id} tour={tour} />
                  ))}
                </div>
              )}

              {!isLoading && !isError && (
                <Pagination page={page} pages={pages} onChange={goToPage} />
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function ToursPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
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
