"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useMemo, useState } from "react";
import { useTourRoster } from "@/hooks/useGuide";
import { formatDate } from "@/lib/utils";
import { Badge, PageHeader } from "@/components/admin/ui";
import type { RosterBooking } from "@/services/guide";

type Tab = "upcoming" | "past";

type DepartureGroup = {
  key: string;
  date: Date;
  bookings: RosterBooking[];
  guests: number;
};

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/* `now` is passed in so render stays pure */
const countdown = (date: Date, now: number) => {
  const days = Math.round(
    (startOfDay(date) - startOfDay(new Date(now))) / 86_400_000,
  );

  if (days === 0) return { label: "Today", urgent: true };
  if (days === 1) return { label: "Tomorrow", urgent: true };
  if (days > 1) return { label: `in ${days} days`, urgent: days <= 7 };
  if (days === -1) return { label: "Yesterday", urgent: false };

  return { label: `${Math.abs(days)} days ago`, urgent: false };
};

const initials = (name?: string) =>
  (name ?? "G")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "G";

const isUrl = (v?: string) => Boolean(v && /^https?:\/\//.test(v));

function Avatar({
  name,
  photo,
  px = 40,
}: {
  name?: string;
  photo?: string;
  px?: number;
}) {
  const style = { width: px, height: px };

  if (isUrl(photo)) {
    return (
      <Image
        src={photo as string}
        alt={name ?? "Guest"}
        width={px}
        height={px}
        unoptimized
        style={style}
        className="shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <span
      aria-hidden
      style={style}
      className="flex shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700"
    >
      {initials(name)}
    </span>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

function RosterSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true">
      <div className="h-40 rounded-2xl bg-gray-100" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-gray-100" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-gray-100" />
    </div>
  );
}

export default function TourRosterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading, isError, error, refetch } = useTourRoster(id);

  const [tab, setTab] = useState<Tab>("upcoming");
  const [query, setQuery] = useState("");
  /* Captured once on mount (lazy initializer keeps render pure) */
  const [now] = useState(() => Date.now());

  const capacity = data?.tour.maxGroupSize;

  /* Build departure groups: booked dates + upcoming tour dates with no bookings yet */
  const { upcoming, past } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const map = new Map<string, DepartureGroup>();

    (data?.tour.startDates ?? []).forEach((d) => {
      const date = new Date(d);

      if (date.getTime() >= now) {
        const key = date.toISOString();

        map.set(key, { key, date, bookings: [], guests: 0 });
      }
    });

    (data?.bookings ?? []).forEach((b) => {
      const date = new Date(b.startDate);
      const key = date.toISOString();
      const group = map.get(key) ?? { key, date, bookings: [], guests: 0 };

      group.bookings.push(b);
      group.guests += b.guests;
      map.set(key, group);
    });

    const matches = (b: RosterBooking) =>
      !q ||
      [b.user?.name, b.bookingReference, b._id.slice(-6), b.user?.phoneNumber]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));

    /* Capacity uses the full group size, so keep `guests` as computed above */
    const all = [...map.values()]
      .map((g) => ({ ...g, bookings: g.bookings.filter(matches) }))
      /* While searching, hide departures with no matching guest */
      .filter((g) => !q || g.bookings.length > 0);

    return {
      upcoming: all
        .filter((g) => g.date.getTime() >= now)
        .sort((a, b) => a.date.getTime() - b.date.getTime()),
      past: all
        .filter((g) => g.date.getTime() < now)
        .sort((a, b) => b.date.getTime() - a.date.getTime()),
    };
  }, [data, query, now]);

  const visible = tab === "upcoming" ? upcoming : past;
  const tour = data?.tour;
  const stats = data?.stats;
  const next = stats?.nextDeparture ? new Date(stats.nextDeparture) : null;

  return (
    <>
      <PageHeader
        title={tour?.name ?? "Guest roster"}
        subtitle="Guests by departure date"
        action={
          <div className="flex items-center gap-4 print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              disabled={!data}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Print roster
            </button>
            <Link
              href="/guide/tours"
              className="text-sm font-semibold text-emerald-700"
            >
              ← Back to my tours
            </Link>
          </div>
        }
      />

      {isLoading && <RosterSkeleton />}

      {isError && (
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
        >
          {(error as { message?: string })?.message ||
            "Couldn't load this roster."}{" "}
          <button className="font-semibold underline" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      )}

      {data && tour && stats && (
        <div className="space-y-6">
          {/* Tour overview */}
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col sm:flex-row">
              {isUrl(tour.imageCover) && (
                <div className="relative h-40 w-full shrink-0 sm:h-auto sm:min-h-40 sm:w-56 print:hidden">
                  <Image
                    src={tour.imageCover as string}
                    alt={tour.name}
                    fill
                    unoptimized
                    sizes="(min-width: 640px) 224px, 100vw"
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-1 space-y-3 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  {tour.difficulty && (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold capitalize text-emerald-700">
                      {tour.difficulty}
                    </span>
                  )}
                  {tour.duration != null && (
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                      {tour.duration} day{tour.duration === 1 ? "" : "s"}
                    </span>
                  )}
                  {capacity != null && (
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                      Max group: {capacity}
                    </span>
                  )}
                </div>

                {(tour.startLocation?.description ||
                  tour.startLocation?.address) && (
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-900">
                      Meeting point:{" "}
                    </span>
                    {tour.startLocation?.description ??
                      tour.startLocation?.address}
                  </p>
                )}

                {tour.guides && tour.guides.length > 0 && (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900">
                      Guides:
                    </span>
                    {tour.guides.map((g) => (
                      <span
                        key={g._id}
                        className="flex items-center gap-2 text-sm text-gray-700"
                      >
                        <Avatar name={g.name} photo={g.photo} px={28} />
                        {g.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Upcoming guests"
              value={stats.upcomingGuests}
              hint={`${stats.upcomingBookings} booking${stats.upcomingBookings === 1 ? "" : "s"}`}
            />
            <StatCard
              label="Upcoming departures"
              value={stats.upcomingDepartures}
              hint="With at least one booking"
            />
            <StatCard
              label="Next departure"
              value={next ? formatDate(next.toISOString()) : "None"}
              hint={next ? countdown(next, now).label : "No dates scheduled"}
            />
            <StatCard
              label="All-time guests"
              value={stats.totalGuests}
              hint={`${stats.completedBookings} completed booking${stats.completedBookings === 1 ? "" : "s"}`}
            />
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
            <div
              role="tablist"
              aria-label="Departures"
              className="inline-flex rounded-xl border border-gray-200 bg-white p-1"
            >
              {(
                [
                  ["upcoming", "Upcoming", upcoming.length],
                  ["past", "Past", past.length],
                ] as const
              ).map(([value, label, count]) => (
                <button
                  key={value}
                  role="tab"
                  aria-selected={tab === value}
                  onClick={() => setTab(value)}
                  className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                    tab === value
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {label}{" "}
                  <span
                    className={
                      tab === value ? "text-emerald-100" : "text-gray-400"
                    }
                  >
                    {count}
                  </span>
                </button>
              ))}
            </div>

            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, booking ref or phone…"
              aria-label="Search guests"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 sm:w-72"
            />
          </div>

          {/* Departures */}
          {visible.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
              {query
                ? "No guests match your search."
                : tab === "upcoming"
                  ? "No upcoming departures."
                  : "No past departures yet."}
            </p>
          ) : (
            <div className="space-y-6">
              {visible.map((g) => {
                const when = countdown(g.date, now);
                const pct = capacity
                  ? Math.min(100, Math.round((g.guests / capacity) * 100))
                  : null;
                const spotsLeft = capacity ? capacity - g.guests : null;

                return (
                  <section
                    key={g.key}
                    className="rounded-2xl border border-gray-200 bg-white shadow-sm print:break-inside-avoid"
                  >
                    <header className="space-y-3 border-b border-gray-100 px-5 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-semibold text-gray-900">
                            {formatDate(g.key)}
                          </h2>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              when.urgent
                                ? "bg-amber-100 text-amber-800"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {when.label}
                          </span>
                        </div>
                        <Badge tone="green">
                          {g.guests} guest{g.guests === 1 ? "" : "s"} ·{" "}
                          {g.bookings.length} booking
                          {g.bookings.length === 1 ? "" : "s"}
                        </Badge>
                      </div>

                      {pct !== null && capacity && (
                        <div>
                          <div
                            className="h-2 overflow-hidden rounded-full bg-gray-100"
                            role="progressbar"
                            aria-valuenow={g.guests}
                            aria-valuemin={0}
                            aria-valuemax={capacity}
                            aria-label="Group capacity"
                          >
                            <div
                              className={`h-full rounded-full ${
                                pct >= 100
                                  ? "bg-red-500"
                                  : pct >= 80
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            {g.guests} of {capacity} places filled
                            {tab === "upcoming" && spotsLeft !== null
                              ? spotsLeft > 0
                                ? ` · ${spotsLeft} left`
                                : " · Full"
                              : ""}
                          </p>
                        </div>
                      )}
                    </header>

                    {g.bookings.length === 0 ? (
                      <p className="px-5 py-4 text-sm text-gray-500">
                        No bookings for this departure yet.
                      </p>
                    ) : (
                      <ul className="divide-y divide-gray-100">
                        {g.bookings.map((b) => (
                          <li
                            key={b._id}
                            className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <Avatar
                                name={b.user?.name}
                                photo={b.user?.photo}
                              />
                              <div className="min-w-0">
                                <p className="truncate font-medium text-gray-900">
                                  {b.user?.name ?? "Guest"}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Ref{" "}
                                  <span className="font-mono">
                                    {b.bookingReference ?? b._id.slice(-6)}
                                  </span>{" "}
                                  · party of {b.guests}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <Badge
                                tone={
                                  b.status === "completed" ? "gray" : "green"
                                }
                              >
                                {b.status}
                              </Badge>
                              {b.user?.phoneNumber ? (
                                <a
                                  href={`tel:${b.user.phoneNumber}`}
                                  className="font-semibold text-emerald-700 hover:underline"
                                >
                                  {b.user.phoneNumber}
                                </a>
                              ) : (
                                <span className="text-xs text-gray-400">
                                  No phone
                                </span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
}
