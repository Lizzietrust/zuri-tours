"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useGuideDashboard } from "@/hooks/useGuide";
import { imageUrl } from "@/services/tours";
import { formatDate } from "@/lib/utils";
import { Badge, INPUT, PageHeader } from "@/components/admin/ui";

export default function GuideToursPage() {
  const { data, isLoading, isError, refetch } = useGuideDashboard();
  const [q, setQ] = useState("");

  const tours = useMemo(() => {
    const term = q.trim().toLowerCase();
    const all = data?.tours ?? [];

    return term ? all.filter((t) => t.name.toLowerCase().includes(term)) : all;
  }, [data, q]);

  return (
    <>
      <PageHeader
        title="My tours"
        subtitle="Tours you're assigned to. Open one to see its guest roster."
      />

      {isLoading && <p className="text-sm text-gray-500">Loading…</p>}
      {isError && (
        <button
          onClick={() => refetch()}
          className="text-sm font-semibold text-emerald-700"
        >
          Couldn&apos;t load your tours — try again
        </button>
      )}

      {data && (
        <>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-gray-600">
              {data.tours.length} assigned tour
              {data.tours.length === 1 ? "" : "s"}
            </p>
            {data.tours.length > 4 && (
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search your tours…"
                aria-label="Search your tours"
                className={`${INPUT} w-full sm:w-72`}
              />
            )}
          </div>

          {data.tours.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
              You haven&apos;t been assigned to any tours yet. A lead guide can
              assign you.
            </p>
          ) : tours.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
              No tours match &quot;{q}&quot;.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {tours.map((t) => (
                <Link
                  key={t._id}
                  href={`/guide/tours/${t._id}`}
                  className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl(t.imageCover ?? "")}
                    alt=""
                    className="h-36 w-full bg-gray-100 object-cover"
                  />
                  <div className="p-5">
                    <p className="font-semibold text-gray-900 group-hover:text-emerald-800">
                      {t.name}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {t.nextDeparture
                        ? `Next departure: ${formatDate(t.nextDeparture)}`
                        : "No upcoming dates"}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <Badge tone={t.upcomingGuests > 0 ? "green" : "gray"}>
                        {t.upcomingGuests} confirmed guest
                        {t.upcomingGuests === 1 ? "" : "s"}
                      </Badge>
                      <span className="text-xs font-semibold text-emerald-700">
                        View roster →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
