"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAssignedTours } from "@/hooks/useGuide";
import type { Tour } from "@/types";

type Filter = "all" | "upcoming" | "past";

const EMPTY_TOURS: Tour[] = [];

function nextStart(tour: Tour): Date | null {
  if (!tour.startDates?.length) return null;
  const now = Date.now();
  return (
    tour.startDates
      .map((d) => new Date(d))
      .filter((d) => d.getTime() >= now)
      .sort((a, b) => a.getTime() - b.getTime())[0] ?? null
  );
}

function lastStart(tour: Tour): Date | null {
  if (!tour.startDates?.length) return null;
  return (
    tour.startDates
      .map((d) => new Date(d))
      .sort((a, b) => b.getTime() - a.getTime())[0] ?? null
  );
}

function isPast(tour: Tour): boolean {
  const last = lastStart(tour);
  return !!last && last.getTime() < Date.now();
}

export default function GuideToursPage() {
  const { data, isLoading, isError } = useAssignedTours();
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");

  const tours = data ?? EMPTY_TOURS;

  const filtered = useMemo(() => {
    let list = tours;
    if (filter === "upcoming") list = list.filter((t) => nextStart(t));
    if (filter === "past") list = list.filter(isPast);
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(needle) ||
          t.summary?.toLowerCase().includes(needle) ||
          t.location?.city?.toLowerCase().includes(needle),
      );
    }
    return list;
  }, [tours, filter, q]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            My tours
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {tours.length} tour{tours.length === 1 ? "" : "s"} assigned to you
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {(["all", "upcoming", "past"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition ${
              filter === f
                ? "bg-emerald-600 text-white"
                : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {f}
          </button>
        ))}

        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tours…"
          className="ml-auto w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      {/* List */}
      <div className="mt-6">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-2xl border border-gray-200 bg-white"
              />
            ))}
          </div>
        )}

        {isError && (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            Failed to load tours.
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
            <span className="text-4xl" aria-hidden>
              🔍
            </span>
            <p className="mt-3 text-sm font-medium text-gray-700">
              No tours match your filters
            </p>
          </div>
        )}

        {filtered.length > 0 && (
          <ul className="space-y-3">
            {filtered.map((tour) => {
              const next = nextStart(tour);
              const past = isPast(tour);

              return (
                <li
                  key={tour._id}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/tours/${tour.slug}`}
                          className="text-base font-semibold text-gray-900 hover:text-emerald-700"
                        >
                          {tour.name}
                        </Link>
                        {past && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                            Past
                          </span>
                        )}
                        {!past && next && (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            Upcoming
                          </span>
                        )}
                      </div>

                      <p className="mt-0.5 line-clamp-2 text-sm text-gray-500">
                        {tour.summary}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                        <span className="capitalize">🧭 {tour.difficulty}</span>
                        <span>⏱ {tour.duration} days</span>
                        <span>👥 {tour.maxGroupSize} max</span>
                        <span>💵 ${tour.price}</span>
                        <span>
                          ⭐ {tour.ratingsAverage?.toFixed(1) ?? "—"} (
                          {tour.ratingsQuantity ?? 0})
                        </span>
                      </div>

                      {tour.startDates && tour.startDates.length > 0 && (
                        <p className="mt-2 text-xs text-gray-500">
                          <span className="font-medium text-gray-700">
                            Start dates:
                          </span>{" "}
                          {tour.startDates
                            .map((d) =>
                              new Date(d).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              }),
                            )
                            .join(" · ")}
                        </p>
                      )}
                    </div>

                    <Link
                      href={`/guide/tours/${tour._id}`}
                      className="shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      Manage →
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
