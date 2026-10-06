"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTours } from "@/hooks/useTours";
import { useGeolocation } from "@/hooks/useGeolocation";
import { TourMapDynamic } from "@/components/map/TourMapDynamic";
import TourCard from "@/components/tours/TourCard";
import type { Tour } from "@/types";
import {
  distanceKm,
  formatDistance,
  getTourCoords,
  type LatLng,
} from "@/lib/geo";

const RADIUS_OPTIONS = [5, 10, 25, 50, 100, 250, 500] as const;
const DEFAULT_RADIUS = 50;

type SortKey = "distance" | "price" | "rating";

const PERMISSION_STATUSES = new Set(["prompt", "idle", "denied", "error"]);

export default function NearMeClient() {
  const {
    status,
    coords: userCoords,
    accuracy,
    error: geoError,
    request: requestLocation,
  } = useGeolocation();

  const [radiusKm, setRadiusKm] = useState<number>(DEFAULT_RADIUS);
  const [sortBy, setSortBy] = useState<SortKey>("distance");
  const [activeTourId, setActiveTourId] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useTours({
    sort: "-createdAt",
  });

  const allTours = useMemo(() => (data?.data?.tours ?? []) as Tour[], [data]);

  const toursWithDistance = useMemo(() => {
    if (!userCoords) return [];
    return allTours
      .map((tour) => {
        const coords = getTourCoords(tour.location);
        if (!coords) return null;
        return {
          tour,
          coords,
          distance: distanceKm(userCoords, coords),
        };
      })
      .filter(
        (x): x is { tour: Tour; coords: LatLng; distance: number } =>
          x !== null,
      )
      .filter((x) => x.distance <= radiusKm);
  }, [allTours, userCoords, radiusKm]);

  const nearbyTours = useMemo(() => {
    const copy = [...toursWithDistance];
    copy.sort((a, b) => {
      if (sortBy === "price") return a.tour.price - b.tour.price;
      if (sortBy === "rating")
        return (b.tour.ratingsAverage ?? 0) - (a.tour.ratingsAverage ?? 0);
      return a.distance - b.distance;
    });
    return copy;
  }, [toursWithDistance, sortBy]);

  const mapCenter: LatLng = userCoords ?? { lat: -1.286389, lng: 36.817223 };

  const handleSelectTour = useCallback((tour: Tour) => {
    setActiveTourId(tour._id);
    const el = document.getElementById(`tour-${tour._id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  useEffect(() => {
    if (status === "idle") requestLocation();
  }, [status, requestLocation]);

  const needsPermission = PERMISSION_STATUSES.has(status);
  const isLocating = status === "locating";

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <nav className="mb-4 text-sm text-gray-500">
        <Link href="/tours" className="hover:text-emerald-700">
          Tours
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">Near me</span>
      </nav>

      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Tours near you
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {userCoords
              ? `Showing adventures within ${radiusKm} km of your location.`
              : "Share your location to see tours on the map."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-gray-600">
            Radius
            <select
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              disabled={!userCoords}
              className="ml-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:opacity-60"
            >
              {RADIUS_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r} km
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-gray-600">
            Sort
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="ml-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            >
              <option value="distance">Closest</option>
              <option value="price">Cheapest</option>
              <option value="rating">Top rated</option>
            </select>
          </label>

          {userCoords && (
            <button
              type="button"
              onClick={requestLocation}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              📍 Refresh location
            </button>
          )}
        </div>
      </div>

      {needsPermission && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📍</span>
              <div>
                <h2 className="font-semibold text-amber-900">
                  {status === "denied"
                    ? "Location access denied"
                    : status === "error"
                      ? "We couldn't get your location"
                      : "Enable location to see tours near you"}
                </h2>
                <p className="mt-1 text-sm text-amber-800">
                  {geoError ||
                    "We use your location only to sort and filter tours by distance. It never leaves your browser."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={requestLocation}
              disabled={isLocating}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
            >
              {isLocating ? "Locating…" : "Allow location"}
            </button>
          </div>
        </div>
      )}

      {isLocating && !userCoords && (
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
          Getting your location…
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="order-2 lg:order-1">
          <TourMapDynamic
            tours={allTours}
            center={mapCenter}
            userCoords={userCoords}
            radiusKm={userCoords ? radiusKm : undefined}
            onSelectTour={handleSelectTour}
          />

          {userCoords && accuracy && (
            <p className="mt-2 text-xs text-gray-400">
              Accuracy: ±{Math.round(accuracy)} m · {allTours.length} tours on
              map
            </p>
          )}

          {isError && (
            <div className="mt-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">
                {(error as Error)?.message || "Failed to load tours."}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        <aside className="order-1 lg:order-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {userCoords ? "Nearby tours" : "All tours"}
            </h2>
            {userCoords && (
              <span className="text-sm text-gray-500">
                {nearbyTours.length} found
              </span>
            )}
          </div>

          <div className="mt-4 max-h-150 space-y-4 overflow-y-auto pr-1">
            {isLoading && (
              <>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-2xl border border-gray-200 bg-white p-4"
                  >
                    <div className="h-3 w-2/3 rounded bg-gray-200" />
                    <div className="mt-2 h-3 w-full rounded bg-gray-200" />
                    <div className="mt-2 h-3 w-4/5 rounded bg-gray-200" />
                  </div>
                ))}
              </>
            )}

            {!isLoading && userCoords && nearbyTours.length === 0 && (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                <span className="text-3xl">🗺️</span>
                <p className="mt-2 text-sm font-medium text-gray-800">
                  No tours within {radiusKm} km
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Try increasing the radius.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setRadiusKm(
                      RADIUS_OPTIONS.find((r) => r > radiusKm) ??
                        RADIUS_OPTIONS[RADIUS_OPTIONS.length - 1],
                    )
                  }
                  className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Widen search
                </button>
              </div>
            )}

            {!isLoading &&
              userCoords &&
              nearbyTours.map(({ tour, distance }) => (
                <div
                  key={tour._id}
                  id={`tour-${tour._id}`}
                  className={
                    activeTourId === tour._id
                      ? "rounded-2xl ring-2 ring-emerald-400 ring-offset-2 transition"
                      : "transition"
                  }
                >
                  <div className="relative">
                    <TourCard tour={tour} />
                    <span className="absolute right-3 top-3 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow">
                      {formatDistance(distance)}
                    </span>
                  </div>
                </div>
              ))}

            {!isLoading && !userCoords && (
              <div className="space-y-4">
                {allTours.slice(0, 6).map((tour) => (
                  <TourCard key={tour._id} tour={tour} />
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
