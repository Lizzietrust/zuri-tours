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
import { useTours } from "@/hooks/useTours";
import TourCard from "@/components/tours/TourCard";
import TourCardSkeleton from "@/components/tours/TourCardSkeleton";
import TourFilters from "@/components/tours/TourFilters";
import ActiveFilterChips from "@/components/tours/ActiveFilterChips";
import type { Tour, TourFilters as Filters, TourQueryParams } from "@/types";

const PAGE_SIZE = 9;

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

function buildUrl(filters: Filters, page = 1): string {
  const sp = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = filters[key];
    if (value !== "" && value !== DEFAULT_FILTERS[key]) sp.set(key, value);
  }
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
  initial,
  onSearch,
}: {
  initial: string;
  onSearch: (q: string) => void;
}) {
  const [value, setValue] = useState(initial);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSearch(value.trim());
  };

  return (
    <form
      onSubmit={submit}
      role="search"
      className="mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-lg shadow-emerald-900/5 focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100"
    >
      <label htmlFor="tours-search" className="sr-only">
        Search tours
      </label>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        className="ml-2 h-5 w-5 shrink-0 text-gray-400"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </svg>
      <input
        id="tours-search"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search destinations or tours…"
        className="min-w-0 flex-1 bg-transparent px-1 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none"
      />
      <button
        type="submit"
        className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
      >
        Search
      </button>
    </form>
  );
}

function pageItems(current: number, total: number): (number | "…")[] {
  const set = new Set<number>([1, total, current, current - 1, current + 1]);
  const nums = [...set]
    .filter((n) => n >= 1 && n <= total)
    .sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push("…");
    out.push(n);
  });
  return out;
}

function Pagination({
  page,
  pages,
  onChange,
}: {
  page: number;
  pages: number;
  onChange: (page: number) => void;
}) {
  if (pages <= 1) return null;

  const base =
    "inline-flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600";

  return (
    <nav
      aria-label="Pagination"
      className="mt-10 flex flex-wrap items-center justify-center gap-1.5"
    >
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className={`${base} border-gray-200 bg-white text-gray-700 hover:border-emerald-300 hover:bg-emerald-50 disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:bg-white`}
      >
        ← Prev
      </button>

      {pageItems(page, pages).map((item, i) =>
        item === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-gray-400" aria-hidden>
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            aria-current={item === page ? "page" : undefined}
            aria-label={`Page ${item}`}
            className={`${base} ${
              item === page
                ? "border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "border-gray-200 bg-white text-gray-700 hover:border-emerald-300 hover:bg-emerald-50"
            }`}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= pages}
        className={`${base} border-gray-200 bg-white text-gray-700 hover:border-emerald-300 hover:bg-emerald-50 disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:bg-white`}
      >
        Next →
      </button>
    </nav>
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

  const setFilters = useCallback(
    (next: Filters) => router.replace(buildUrl(next), { scroll: false }),
    [router],
  );

  const handleReset = useCallback(
    () => router.replace("/tours", { scroll: false }),
    [router],
  );

  const goToPage = useCallback(
    (p: number) => {
      router.replace(buildUrl(filters, p), { scroll: false });
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    },
    [router, filters],
  );

  const queryParams = useMemo<TourQueryParams>(
    () => ({ ...toQueryParams(filters), page, limit: PAGE_SIZE }),
    [filters, page],
  );

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

  const total = data?.total ?? rawTours.length;
  const pages = data?.pages ?? 1;
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  const errorMessage =
    (error as { message?: string } | null)?.message ||
    "An unexpected error occurred.";

  const isFiltered = FILTER_KEYS.some((k) => k !== "sort" && filters[k] !== "");

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
            {filters.q ? (
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
            Handpicked tours around the world — filter by difficulty, price, and
            rating to find your perfect trip.
          </p>

          {/* key remounts the bar when q changes elsewhere (chips, reset) */}
          <SearchBar
            key={filters.q}
            initial={filters.q}
            onSearch={(q) => setFilters({ ...filters, q })}
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
                    ? "Loading tours…"
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
                      We couldn&apos;t load tours right now.
                    </span>{" "}
                    {errorMessage}
                  </span>
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="rounded-lg bg-amber-600 px-3 py-1.5 font-semibold text-white hover:bg-amber-700"
                  >
                    Try again
                  </button>
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
                    {isFiltered ? "🔍" : "🧭"}
                  </span>
                  <h2 className="mt-3 text-lg font-semibold text-gray-900">
                    {filters.q
                      ? `No tours found for “${filters.q}”`
                      : isFiltered
                        ? "No tours match your filters"
                        : "No tours yet"}
                  </h2>
                  <p className="mt-1 max-w-md text-sm text-gray-600">
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
