"use client";

import Link from "next/link";
import { use, useMemo } from "react";
import { useTourRoster } from "@/hooks/useGuide";
import { formatDate } from "@/lib/utils";
import { Badge, PageHeader } from "@/components/admin/ui";
import type { RosterBooking } from "@/services/guide";

export default function TourRosterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading, isError, error, refetch } = useTourRoster(id);

  const groups = useMemo(() => {
    const map = new Map<string, RosterBooking[]>();

    (data?.bookings ?? []).forEach((b) => {
      const day = new Date(b.startDate).toISOString();

      map.set(day, [...(map.get(day) ?? []), b]);
    });

    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [data]);

  return (
    <>
      <PageHeader
        title={data?.tour.name ?? "Guest roster"}
        subtitle="Guests by departure date"
        action={
          <Link
            href="/guide/tours"
            className="text-sm font-semibold text-emerald-700"
          >
            ← Back to my tours
          </Link>
        }
      />

      {isLoading && <p className="text-sm text-gray-500">Loading…</p>}
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

      {data && groups.length === 0 && (
        <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
          No bookings yet.
        </p>
      )}

      <div className="space-y-6">
        {groups.map(([day, bookings]) => {
          const total = bookings.reduce((s, b) => s + b.guests, 0);

          return (
            <section
              key={day}
              className="rounded-2xl border border-gray-200 bg-white shadow-sm"
            >
              <header className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                <h2 className="font-semibold text-gray-900">
                  {formatDate(day)}
                </h2>
                <Badge tone="green">
                  {total} guest{total === 1 ? "" : "s"}
                </Badge>
              </header>
              <ul className="divide-y divide-gray-100">
                {bookings.map((b) => (
                  <li
                    key={b._id}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900">
                        Booked by {b.user?.name ?? "Guest"}
                      </p>
                      <p className="text-xs text-gray-500">
                        Booking ref: {b.bookingReference ?? b._id.slice(-6)} ·
                        party of {b.guests}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {b.status === "completed" && (
                        <Badge tone="gray">completed</Badge>
                      )}
                      {b.user?.phoneNumber && (
                        <a
                          href={`tel:${b.user.phoneNumber}`}
                          className="font-semibold text-emerald-700 hover:underline"
                        >
                          {b.user.phoneNumber}
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
