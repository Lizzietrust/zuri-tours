"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAssignedTours } from "@/hooks/useGuide";
import { useNow } from "@/hooks/useNow";
import { imageUrl } from "@/services/tours";

function formatDate(d?: string | Date) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function GuideTourDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const { data, isLoading, isError } = useAssignedTours();
  const now = useNow();

  const tour = useMemo(() => data?.find((t) => t._id === id), [data, id]);

  const { upcoming, past } = useMemo(() => {
    const raw = tour?.startDates ?? [];
    const dates = raw.map((d) => new Date(d));

    if (now === null) {
      return {
        upcoming: [...dates].sort((a, b) => a.getTime() - b.getTime()),
        past: [] as Date[],
      };
    }

    return {
      upcoming: dates
        .filter((d) => d.getTime() >= now)
        .sort((a, b) => a.getTime() - b.getTime()),
      past: dates
        .filter((d) => d.getTime() < now)
        .sort((a, b) => b.getTime() - a.getTime()),
    };
  }, [tour, now]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="h-64 animate-pulse rounded-2xl border border-gray-200 bg-white" />
      </div>
    );
  }

  if (isError || !tour) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <Link
          href="/guide/tours"
          className="text-sm font-medium text-emerald-700 hover:underline"
        >
          ← Back to tours
        </Link>
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          Tour not found or you don&apos;t have access.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link
        href="/guide/tours"
        className="text-sm font-medium text-emerald-700 hover:underline"
      >
        ← Back to tours
      </Link>

      <header className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {tour.imageCover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl(tour.imageCover)}
            alt={tour.name}
            className="h-56 w-full object-cover"
          />
        )}
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">{tour.name}</h1>
          <p className="mt-1 text-sm text-gray-500">{tour.summary}</p>

          <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-400">
                Difficulty
              </dt>
              <dd className="mt-0.5 text-sm font-semibold capitalize text-gray-800">
                {tour.difficulty}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-400">
                Duration
              </dt>
              <dd className="mt-0.5 text-sm font-semibold text-gray-800">
                {tour.duration} days
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-400">
                Group size
              </dt>
              <dd className="mt-0.5 text-sm font-semibold text-gray-800">
                {tour.maxGroupSize} max
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-400">
                Rating
              </dt>
              <dd className="mt-0.5 text-sm font-semibold text-gray-800">
                ⭐ {tour.ratingsAverage?.toFixed(1) ?? "—"}{" "}
                <span className="text-xs font-normal text-gray-500">
                  ({tour.ratingsQuantity ?? 0})
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </header>

      {/* Start dates */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Upcoming
          </h2>
          {upcoming.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">No upcoming dates.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {upcoming.map((d, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 text-sm text-gray-800"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {formatDate(d)}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Past
          </h2>
          {past.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">No past dates.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {past.slice(0, 5).map((d, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 text-sm text-gray-500"
                >
                  <span className="h-2 w-2 rounded-full bg-gray-300" />
                  {formatDate(d)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Description */}
      {tour.description && (
        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Description</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-700">
            {tour.description}
          </p>
        </section>
      )}
    </div>
  );
}
