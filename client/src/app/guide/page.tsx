"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useGuideStatistics, useAssignedTours } from "@/hooks/useGuide";
import type { Tour } from "@/types";

/* ============================================================
   SMALL UI PRIMITIVES
   ============================================================ */

function StatCard({
  icon,
  label,
  value,
  hint,
  accent = "emerald",
}: {
  icon: string;
  label: string;
  value: string | number;
  hint?: string;
  accent?: "emerald" | "sky" | "amber" | "violet";
}) {
  const ring = {
    emerald: "bg-emerald-50 text-emerald-700",
    sky: "bg-sky-50 text-sky-700",
    amber: "bg-amber-50 text-amber-700",
    violet: "bg-violet-50 text-violet-700",
  }[accent];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full text-lg ${ring}`}
        aria-hidden
      >
        {icon}
      </div>
      <p className="mt-4 text-2xl font-extrabold tracking-tight text-gray-900">
        {value}
      </p>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="h-32 animate-pulse rounded-2xl border border-gray-200 bg-white" />
  );
}

function SkeletonTour() {
  return (
    <div className="h-28 animate-pulse rounded-2xl border border-gray-200 bg-white" />
  );
}

function formatDate(d?: string | Date) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function nextStartDate(tour: Tour): Date | null {
  if (!tour.startDates || tour.startDates.length === 0) return null;
  const now = Date.now();
  const upcoming = tour.startDates
    .map((d) => new Date(d))
    .filter((d) => d.getTime() >= now)
    .sort((a, b) => a.getTime() - b.getTime());
  return upcoming[0] ?? null;
}

/* ============================================================
   TOUR ROW
   ============================================================ */

function AssignedTourRow({ tour }: { tour: Tour }) {
  const next = nextStartDate(tour);

  return (
    <li className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/tours/${tour.slug}`}
            className="text-base font-semibold text-gray-900 hover:text-emerald-700"
          >
            {tour.name}
          </Link>
          <p className="mt-0.5 line-clamp-2 text-sm text-gray-500">
            {tour.summary}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
            <span className="capitalize">🧭 {tour.difficulty}</span>
            <span>⏱ {tour.duration} days</span>
            <span>💵 ${tour.price}</span>
            <span>⭐ {tour.ratingsAverage?.toFixed(1) ?? "—"}</span>
            {next && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                Next: {formatDate(next)}
              </span>
            )}
          </div>
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
}

/* ============================================================
   PAGE
   ============================================================ */

export default function GuideDashboardPage() {
  const { user } = useAuth();
  const stats = useGuideStatistics();
  const tours = useAssignedTours();

  const assigned = tours.data ?? [];
  const upcoming = assigned.filter((t) => nextStartDate(t));

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Guide dashboard
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
            Welcome back, {user?.name?.split(" ")[0] ?? "Guide"} 👋
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Here&apos;s what&apos;s happening with your tours.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/guide/profile"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Edit profile
          </Link>
          <Link
            href="/guide/tours"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            My tours
          </Link>
        </div>
      </div>

      {/* Stats */}
      <section className="mt-8">
        {stats.isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {stats.isError && (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            Couldn&apos;t load your statistics.
          </div>
        )}

        {stats.data && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon="🧭"
              label="Total tours"
              value={stats.data.totalTours}
              hint={`${stats.data.upcomingTours} upcoming`}
            />
            <StatCard
              icon="✅"
              label="Completed"
              value={stats.data.completedTours}
              accent="sky"
            />
            <StatCard
              icon="⭐"
              label="Average rating"
              value={
                stats.data.averageRating
                  ? stats.data.averageRating.toFixed(1)
                  : "—"
              }
              hint={`${stats.data.totalReviews} reviews`}
              accent="amber"
            />
            <StatCard
              icon="💰"
              label="Total revenue"
              value={`$${stats.data.totalRevenue.toLocaleString()}`}
              accent="violet"
            />
          </div>
        )}
      </section>

      {/* Assigned tours */}
      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Your assigned tours
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              {assigned.length > 0
                ? `${assigned.length} total · ${upcoming.length} upcoming`
                : "Tours you've been assigned to will appear here."}
            </p>
          </div>
          <Link
            href="/guide/tours"
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            View all →
          </Link>
        </div>

        {tours.isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonTour key={i} />
            ))}
          </div>
        )}

        {tours.isError && (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            Couldn&apos;t load your assigned tours.
          </div>
        )}

        {tours.data && assigned.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
            <span className="text-4xl" aria-hidden>
              🧭
            </span>
            <p className="mt-3 text-sm font-medium text-gray-700">
              No tours assigned yet
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Your lead guide or an admin will assign tours to you.
            </p>
          </div>
        )}

        {assigned.length > 0 && (
          <ul className="space-y-3">
            {assigned.slice(0, 5).map((tour) => (
              <AssignedTourRow key={tour._id} tour={tour} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
