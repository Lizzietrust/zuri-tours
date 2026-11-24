"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useGuideDashboard } from "@/hooks/useGuide";
import { formatDate } from "@/lib/utils";
import { Badge, PageHeader } from "@/components/admin/ui";

function Tile({
  icon,
  label,
  value,
  href,
}: {
  icon: string;
  label: string;
  value: string | number;
  href?: string;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between">
        <span aria-hidden className="text-xl">
          {icon}
        </span>
        {href && (
          <span
            aria-hidden
            className="text-sm font-semibold text-emerald-600 transition group-hover:translate-x-0.5"
          >
            →
          </span>
        )}
      </div>
      <div className="mt-2 text-2xl font-extrabold text-gray-900">{value}</div>
      <div className="text-xs font-medium text-gray-500">{label}</div>
    </>
  );

  if (!href) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        {body}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      {body}
    </Link>
  );
}

export default function GuideOverviewPage() {
  const { user } = useAuth();
  const { data: d, isLoading, isError, refetch } = useGuideDashboard();

  return (
    <>
      <PageHeader
        title={`Hi, ${user?.name?.split(" ")[0] ?? "there"}`}
        subtitle="Your upcoming departures and assigned tours"
      />

      {isLoading && <p className="text-sm text-gray-500">Loading…</p>}
      {isError && (
        <button
          onClick={() => refetch()}
          className="text-sm font-semibold text-emerald-700"
        >
          Couldn&apos;t load your workspace — try again
        </button>
      )}

      {d && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Tile
              icon="🗺️"
              label="Assigned tours"
              value={d.stats.assignedTours}
              href="/guide/tours"
            />
            <Tile
              icon="📆"
              label="Upcoming departures"
              value={d.stats.upcomingDepartures}
            />
            <Tile
              icon="🎟️"
              label="Confirmed guests ahead"
              value={d.stats.upcomingGuests}
            />
            <Tile
              icon="⭐"
              label={`Rating (${d.stats.totalReviews})`}
              value={d.stats.rating > 0 ? d.stats.rating.toFixed(1) : "—"}
            />
          </div>

          <h2 className="mt-10 mb-3 text-lg font-bold text-gray-900">
            Next departures
          </h2>
          <div className="divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white shadow-sm">
            {d.departures.length === 0 && (
              <p className="p-6 text-sm text-gray-500">
                No upcoming departures on your tours.
              </p>
            )}
            {d.departures.map((dep) => (
              <Link
                key={`${dep.tourId}-${dep.startDate}`}
                href={`/guide/tours/${dep.tourId}`}
                className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm transition hover:bg-emerald-50/50"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-900">
                    {dep.tourName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(dep.startDate)}
                  </p>
                </div>
                <Badge tone={dep.guests > 0 ? "green" : "gray"}>
                  {dep.guests} guest{dep.guests === 1 ? "" : "s"}
                </Badge>
              </Link>
            ))}
          </div>

          <div className="mt-10 mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">My tours</h2>
            <Link
              href="/guide/tours"
              className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              View all →
            </Link>
          </div>
          {d.tours.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
              You haven&apos;t been assigned to any tours yet. A lead guide or
              admin can assign you.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {d.tours.map((t) => (
                <Link
                  key={t._id}
                  href={`/guide/tours/${t._id}`}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
                >
                  <p className="font-semibold text-gray-900">{t.name}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {t.nextDeparture
                      ? `Next: ${formatDate(t.nextDeparture)}`
                      : "No upcoming dates"}{" "}
                    · {t.upcomingGuests} confirmed guest
                    {t.upcomingGuests === 1 ? "" : "s"}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
