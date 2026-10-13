"use client";

import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useNearbyTours, useTours } from "@/hooks/useTours";
import { useGeolocation } from "@/hooks/useGeolocation";
import { TourMapDynamic } from "@/components/map/TourMapDynamic";
import TourCard from "@/components/tours/TourCard";
import TourCardSkeleton from "@/components/tours/TourCardSkeleton";
import Pagination from "@/components/ui/Pagination";
import { formatCurrency } from "@/lib/utils";
import { formatDistance, getTourCoords, type LatLng } from "@/lib/geo";
import type { NearbyTourParams, NearbySort } from "@/services/tours";
import type { Tour } from "@/types";

const PAGE_SIZE = 6;
const MAP_LIMIT = 100;
const RADIUS_OPTIONS = [5, 10, 25, 50, 100, 250, 500] as const;
const DEFAULT_RADIUS = 50;

const FALLBACK_CENTER: LatLng = { lat: -1.286389, lng: 36.817223 };
const EMPTY_TOURS: Tour[] = [];

const SORT_OPTIONS: { value: NearbySort; label: string }[] = [
  { value: "distance", label: "Closest first" },
  { value: "ratingsAverage", label: "Top rated" },
  { value: "price", label: "Cheapest" },
  { value: "duration", label: "Shortest trip" },
];

const DIFFICULTY_OPTIONS = [
  { value: "", label: "Any difficulty" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Moderate" },
  { value: "difficult", label: "Challenging" },
];

const round3 = (n: number) => Math.round(n * 1000) / 1000;

const selectClass =
  "rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:opacity-60";

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
        active
          ? "border-emerald-600 bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
          : "border-gray-200 bg-white text-gray-700 hover:border-emerald-300 hover:bg-emerald-50"
      }`}
    >
      {children}
    </button>
  );
}

export default function NearMeClient() {
  const {
    status,
    coords,
    accuracy,
    error: geoError,
    request: requestLocation,
  } = useGeolocation();

  const [radiusKm, setRadiusKm] = useState<number>(DEFAULT_RADIUS);
  const [sortBy, setSortBy] = useState<NearbySort>("distance");
  const [difficulty, setDifficulty] = useState("");
  const [page, setPage] = useState(1);
  const [activeTourId, setActiveTourId] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);

  const isLocating = status === "locating";
  const isChecking = status === "idle";

  /* ---------- Backend queries (TanStack Query) ---------- */

  const point = useMemo(
    () =>
      coords ? { lat: round3(coords.lat), lng: round3(coords.lng) } : null,
    [coords],
  );

  const baseParams = useMemo(
    () =>
      point
        ? {
            lat: point.lat,
            lng: point.lng,
            radius: radiusKm,
            difficulty: difficulty || undefined,
          }
        : null,
    [point, radiusKm, difficulty],
  );

  const listParams = useMemo<NearbyTourParams | null>(
    () =>
      baseParams ? { ...baseParams, sortBy, page, limit: PAGE_SIZE } : null,
    [baseParams, sortBy, page],
  );

  const mapParams = useMemo<NearbyTourParams | null>(
    () =>
      baseParams
        ? { ...baseParams, sortBy: "distance", page: 1, limit: MAP_LIMIT }
        : null,
    [baseParams],
  );

  const list = useNearbyTours(listParams);
  const mapQuery = useNearbyTours(mapParams);

  const fallback = useTours(
    { sort: "-ratingsAverage", limit: PAGE_SIZE },
    { enabled: !coords },
  );

  /* ---------- Derived data ---------- */

  const tours = coords
    ? (list.data?.tours ?? EMPTY_TOURS)
    : (fallback.data?.data.tours ?? EMPTY_TOURS);

  const mapTours = coords
    ? (mapQuery.data?.tours ?? EMPTY_TOURS)
    : (fallback.data?.data.tours ?? EMPTY_TOURS);

  const total = list.data?.total ?? 0;
  const pages = list.data?.pages ?? 1;

  const activeQuery = coords ? list : fallback;
  const isLoading = activeQuery.isLoading;
  const isError = activeQuery.isError;
  const isFetching = activeQuery.isFetching;
  const errorMessage =
    (activeQuery.error as { message?: string } | null)?.message ||
    "Failed to load tours.";

  const mapCenter = useMemo<LatLng>(() => {
    if (coords) return { lat: coords.lat, lng: coords.lng };
    for (const t of mapTours) {
      const c = getTourCoords(t.location);
      if (c) return c;
    }
    return FALLBACK_CENTER;
  }, [coords, mapTours]);

  const selectedTour = useMemo(
    () =>
      activeTourId
        ? ([...tours, ...mapTours].find((t) => t._id === activeTourId) ?? null)
        : null,
    [activeTourId, tours, mapTours],
  );

  /* ---------- Handlers (reset to page 1 when filters change) ---------- */

  const changeRadius = (r: number) => {
    setRadiusKm(r);
    setPage(1);
    setActiveTourId(null);
  };

  const changeSort = (s: NearbySort) => {
    setSortBy(s);
    setPage(1);
  };

  const changeDifficulty = (d: string) => {
    setDifficulty(d);
    setPage(1);
    setActiveTourId(null);
  };

  const goToPage = (p: number) => {
    setPage(p);
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSelectTour = useCallback((tour: Tour) => {
    setActiveTourId(tour._id);
    document
      .getElementById(`tour-${tour._id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const nextRadius = RADIUS_OPTIONS.find((r) => r > radiusKm);

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
          <div className="mb-6">
            <Link
              href="/tours"
              className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              ← All tours
            </Link>
          </div>

          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-3 py-1 text-xs font-medium text-emerald-800 backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 motion-safe:animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Discover close to home
          </span>

          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-balance text-gray-900 sm:text-5xl">
            Adventures{" "}
            <span className="bg-linear-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent">
              near you
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-lg text-pretty text-gray-600">
            {coords
              ? `Showing tours within ${radiusKm} km of your location.`
              : "Share your location and we'll show the closest tours on the map."}
          </p>

          <div className="mt-8 flex flex-col items-center gap-3">
            {coords ? (
              <div className="flex flex-wrap items-center justify-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-sm font-medium text-emerald-800 backdrop-blur">
                  📍 Location found
                  {accuracy ? ` · ±${formatDistance(accuracy / 1000)}` : ""}
                </span>
                <button
                  type="button"
                  onClick={requestLocation}
                  disabled={isLocating}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-emerald-300 hover:bg-emerald-50 disabled:opacity-60"
                >
                  {isLocating ? "Refreshing…" : "Refresh location"}
                </button>
              </div>
            ) : isChecking ? (
              <p className="text-sm text-gray-500">
                Checking location permission…
              </p>
            ) : (
              <button
                type="button"
                onClick={requestLocation}
                disabled={isLocating}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-70"
              >
                {isLocating ? (
                  <>
                    <span
                      aria-hidden
                      className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                    />
                    Locating…
                  </>
                ) : status === "denied" || status === "error" ? (
                  "🔄 Try again"
                ) : (
                  "📍 Use my location"
                )}
              </button>
            )}

            {(status === "denied" || status === "error") && geoError && (
              <p role="alert" className="max-w-md text-sm text-rose-600">
                {geoError}
                {status === "denied" &&
                  " Allow location for this site in your browser settings, then try again."}
              </p>
            )}

            {!coords && !isChecking && (
              <p className="text-xs text-gray-500">
                Your location is only used to find nearby tours.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ========================== RESULTS ========================== */}
      <section className="border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 py-10">
          {/* Controls */}
          {coords && (
            <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    Search radius
                  </p>
                  <div
                    className="flex flex-wrap gap-2"
                    role="group"
                    aria-label="Search radius"
                  >
                    {RADIUS_OPTIONS.map((r) => (
                      <Pill
                        key={r}
                        active={radiusKm === r}
                        onClick={() => changeRadius(r)}
                      >
                        {r} km
                      </Pill>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <label htmlFor="nm-sort" className="sr-only">
                      Sort tours
                    </label>
                    <select
                      id="nm-sort"
                      value={sortBy}
                      onChange={(e) => changeSort(e.target.value as NearbySort)}
                      className={selectClass}
                    >
                      {SORT_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="nm-difficulty" className="sr-only">
                      Filter by difficulty
                    </label>
                    <select
                      id="nm-difficulty"
                      value={difficulty}
                      onChange={(e) => changeDifficulty(e.target.value)}
                      className={selectClass}
                    >
                      {DIFFICULTY_OPTIONS.map((d) => (
                        <option key={d.value || "any"} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_460px]">
            {/* ---------- Map (first on mobile, sticky on desktop) ---------- */}
            <div className="order-1 lg:order-2">
              <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
                <div className="overflow-hidden rounded-2xl shadow-sm">
                  <TourMapDynamic
                    tours={mapTours}
                    center={mapCenter}
                    userCoords={coords}
                    radiusKm={coords ? radiusKm : undefined}
                    onSelectTour={handleSelectTour}
                  />
                </div>

                <p className="text-xs text-gray-500">
                  {coords
                    ? `${mapTours.length} ${mapTours.length === 1 ? "tour" : "tours"} on the map within ${radiusKm} km.`
                    : "Showing popular tours — share your location to see what's close."}
                </p>

                {selectedTour && (
                  <div className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs font-semibold tracking-wide text-emerald-700 uppercase">
                        Selected tour
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTourId(null)}
                        aria-label="Clear selected tour"
                        className="text-gray-400 transition hover:text-gray-600"
                      >
                        ✕
                      </button>
                    </div>
                    <h3 className="mt-1 line-clamp-2 font-bold text-gray-900">
                      {selectedTour.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {[
                        selectedTour.location?.city,
                        selectedTour.location?.country,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                      {typeof selectedTour.distance === "number" &&
                        ` · ${formatDistance(selectedTour.distance)} away`}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-lg font-bold text-emerald-700">
                        {formatCurrency(selectedTour.price)}
                      </span>
                      <Link
                        href={`/tours/${selectedTour.slug}`}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                      >
                        View details →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ---------- List ---------- */}
            <div
              ref={listRef}
              className="order-2 min-w-0 scroll-mt-24 lg:order-1"
            >
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2
                  className="text-lg font-bold text-gray-900"
                  aria-live="polite"
                >
                  {coords
                    ? list.isLoading
                      ? "Finding tours near you…"
                      : `${total} ${total === 1 ? "tour" : "tours"} within ${radiusKm} km`
                    : "Popular tours"}
                </h2>
                {isFetching && !isLoading && (
                  <span className="text-xs text-gray-400" role="status">
                    Updating…
                  </span>
                )}
              </div>

              {isError && (
                <div
                  role="alert"
                  className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800"
                >
                  <span>
                    <span className="font-semibold">
                      We couldn&apos;t load tours right now.
                    </span>{" "}
                    {errorMessage}
                  </span>
                  <button
                    type="button"
                    onClick={() => activeQuery.refetch()}
                    className="rounded-lg bg-amber-600 px-3 py-1.5 font-semibold text-white hover:bg-amber-700"
                  >
                    Try again
                  </button>
                </div>
              )}

              {isLoading && (
                <div className="grid gap-6 sm:grid-cols-2" aria-busy="true">
                  {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                    <TourCardSkeleton key={i} />
                  ))}
                </div>
              )}

              {coords &&
                !list.isLoading &&
                !list.isError &&
                tours.length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
                    <span className="text-4xl" aria-hidden>
                      🗺️
                    </span>
                    <h3 className="mt-3 text-lg font-semibold text-gray-900">
                      No tours within {radiusKm} km
                    </h3>
                    <p className="mt-1 max-w-md text-sm text-gray-600">
                      {nextRadius
                        ? "Try widening your search radius."
                        : difficulty
                          ? "Try removing the difficulty filter."
                          : "We don't have tours in this area yet."}
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-3">
                      {nextRadius && (
                        <button
                          type="button"
                          onClick={() => changeRadius(nextRadius)}
                          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                        >
                          Search within {nextRadius} km
                        </button>
                      )}
                      {difficulty && (
                        <button
                          type="button"
                          onClick={() => changeDifficulty("")}
                          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          Clear difficulty
                        </button>
                      )}
                    </div>
                  </div>
                )}

              {!isLoading && tours.length > 0 && (
                <div
                  className={`grid gap-6 transition-opacity sm:grid-cols-2 ${
                    isFetching ? "opacity-60" : "opacity-100"
                  }`}
                >
                  {tours.map((tour) => (
                    <div
                      key={tour._id}
                      id={`tour-${tour._id}`}
                      className={`h-full scroll-mt-28 rounded-2xl transition ${
                        activeTourId === tour._id
                          ? "ring-2 ring-emerald-400 ring-offset-2"
                          : ""
                      }`}
                    >
                      <TourCard tour={tour} />
                    </div>
                  ))}
                </div>
              )}

              {coords && !list.isError && (
                <Pagination page={page} pages={pages} onChange={goToPage} />
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
