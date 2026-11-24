"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useGuideTeam, useSetTourGuide } from "@/hooks/useGuide";
import { formatDate } from "@/lib/utils";
import { Badge, PageHeader } from "@/components/admin/ui";
import type { Availability, TeamGuide, TeamTour } from "@/services/guide";

type DayKey = keyof Availability;
type View = "tours" | "guides";

const DAYS: { key: DayKey; short: string; letter: string }[] = [
  { key: "monday", short: "Mon", letter: "M" },
  { key: "tuesday", short: "Tue", letter: "T" },
  { key: "wednesday", short: "Wed", letter: "W" },
  { key: "thursday", short: "Thu", letter: "T" },
  { key: "friday", short: "Fri", letter: "F" },
  { key: "saturday", short: "Sat", letter: "S" },
  { key: "sunday", short: "Sun", letter: "S" },
];

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

const isUrl = (v?: string) => Boolean(v && /^https?:\/\//.test(v));

const initials = (name?: string) =>
  (name ?? "G")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "G";

/* null = the guide hasn't set any availability yet; otherwise the days that clash */
const clashDays = (guide: TeamGuide, tour: TeamTour) => {
  const anySet = DAYS.some((d) => guide.availability?.[d.key]);

  if (!anySet) return null;

  return DAYS.filter(
    (d) =>
      (tour.departureDays?.[d.key] ?? 0) > 0 && !guide.availability?.[d.key],
  );
};

function Avatar({
  name,
  photo,
  px = 32,
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
        alt={name ?? "Guide"}
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
  warn,
}: {
  label: string;
  value: number;
  hint?: string;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border bg-white p-4 shadow-sm ${
        warn ? "border-amber-200" : "border-gray-200"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p
        className={`mt-1 text-2xl font-extrabold ${
          warn ? "text-amber-700" : "text-gray-900"
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

function WeekStrip({ availability }: { availability?: Partial<Availability> }) {
  return (
    <div className="flex gap-1" aria-label="Weekly availability">
      {DAYS.map((d) => {
        const on = Boolean(availability?.[d.key]);

        return (
          <span
            key={d.key}
            title={`${d.short}: ${on ? "available" : "off"}`}
            className={`flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold ${
              on ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-400"
            }`}
          >
            {d.letter}
          </span>
        );
      })}
    </div>
  );
}

function TeamSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-gray-100" />
        ))}
      </div>
      <div className="h-12 rounded-xl bg-gray-100" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-40 rounded-2xl bg-gray-100" />
      ))}
    </div>
  );
}

export default function TeamPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const isLead = user?.role === "lead-guide";

  useEffect(() => {
    if (!authLoading && !isLead) router.replace("/guide");
  }, [authLoading, isLead, router]);

  const { data, isLoading, isError, refetch } = useGuideTeam(isLead);
  const setGuide = useSetTourGuide();

  const [view, setView] = useState<View>("tours");
  const [query, setQuery] = useState("");
  const [onlyUnstaffed, setOnlyUnstaffed] = useState(false);
  /* "tourId:guideId" of the chip waiting for remove confirmation */
  const [confirming, setConfirming] = useState<string | null>(null);

  const guideById = useMemo(
    () => new Map((data?.guides ?? []).map((g) => [g._id, g])),
    [data],
  );

  const toursByGuide = useMemo(() => {
    const map = new Map<string, TeamTour[]>();

    (data?.tours ?? []).forEach((t) =>
      t.guides.forEach((gid) => map.set(gid, [...(map.get(gid) ?? []), t])),
    );

    return map;
  }, [data]);

  const counts = useMemo(() => {
    const tours = data?.tours ?? [];
    const guides = data?.guides ?? [];

    return {
      guides: guides.length,
      tours: tours.length,
      unstaffed: tours.filter((t) => t.guides.length === 0).length,
      free: guides.filter((g) => !(toursByGuide.get(g._id)?.length ?? 0))
        .length,
    };
  }, [data, toursByGuide]);

  const q = query.trim().toLowerCase();

  const filteredTours = useMemo(
    () =>
      (data?.tours ?? []).filter(
        (t) =>
          (!onlyUnstaffed || t.guides.length === 0) &&
          (!q ||
            t.name.toLowerCase().includes(q) ||
            t.guides.some((id) =>
              guideById.get(id)?.name.toLowerCase().includes(q),
            )),
      ),
    [data, onlyUnstaffed, q, guideById],
  );

  const filteredGuides = useMemo(
    () =>
      (data?.guides ?? []).filter(
        (g) =>
          !q ||
          g.name.toLowerCase().includes(q) ||
          g.email.toLowerCase().includes(q),
      ),
    [data, q],
  );

  if (authLoading) return <TeamSkeleton />;
  if (!isLead) return null;

  return (
    <>
      <PageHeader
        title="Team"
        subtitle="Assign guides to tours. Changes apply immediately."
      />

      {isLoading && <TeamSkeleton />}

      {isError && (
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
        >
          Couldn&apos;t load the team.{" "}
          <button className="font-semibold underline" onClick={() => refetch()}>
            Try again
          </button>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Guides" value={counts.guides} />
            <StatCard label="Active tours" value={counts.tours} />
            <StatCard
              label="Need a guide"
              value={counts.unstaffed}
              hint={
                counts.unstaffed === 0 ? "All tours covered" : "No guide yet"
              }
              warn={counts.unstaffed > 0}
            />
            <StatCard
              label="Unassigned guides"
              value={counts.free}
              hint="Not on any tour"
            />
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div
                role="tablist"
                aria-label="Team view"
                className="inline-flex rounded-xl border border-gray-200 bg-white p-1"
              >
                {(
                  [
                    ["tours", "By tour"],
                    ["guides", "By guide"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    role="tab"
                    aria-selected={view === value}
                    onClick={() => setView(value)}
                    className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                      view === value
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {view === "tours" && (
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={onlyUnstaffed}
                    onChange={(e) => setOnlyUnstaffed(e.target.checked)}
                    className="h-4 w-4 accent-emerald-600"
                  />
                  Needs a guide
                </label>
              )}
            </div>

            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                view === "tours"
                  ? "Search tours or guides…"
                  : "Search guides by name or email…"
              }
              aria-label="Search"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 sm:w-72"
            />
          </div>

          {/* BY TOUR */}
          {view === "tours" && (
            <div className="space-y-4">
              {filteredTours.length === 0 && (
                <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
                  {data.tours.length === 0
                    ? "There are no active tours yet."
                    : "No tours match your filters."}
                </p>
              )}

              {filteredTours.map((tour) => {
                const busy =
                  setGuide.isPending && setGuide.variables?.tourId === tour._id;

                const available = data.guides
                  .filter((g) => !tour.guides.includes(g._id))
                  .map((g) => ({ g, clash: clashDays(g, tour) }))
                  .sort(
                    (a, b) =>
                      (a.clash === null ? 0.5 : a.clash.length) -
                      (b.clash === null ? 0.5 : b.clash.length),
                  );

                return (
                  <section
                    key={tour._id}
                    className={`rounded-2xl border bg-white p-5 shadow-sm transition ${
                      tour.guides.length === 0
                        ? "border-amber-200"
                        : "border-gray-200"
                    } ${busy ? "opacity-70" : ""}`}
                    aria-busy={busy}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        {isUrl(tour.imageCover) ? (
                          <Image
                            src={tour.imageCover as string}
                            alt=""
                            width={56}
                            height={56}
                            unoptimized
                            className="h-14 w-14 shrink-0 rounded-xl object-cover"
                          />
                        ) : (
                          <span
                            aria-hidden
                            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xl"
                          >
                            🗺️
                          </span>
                        )}
                        <div className="min-w-0">
                          <h2 className="truncate font-semibold text-gray-900">
                            {tour.name}
                          </h2>
                          <p className="text-xs text-gray-500">
                            {tour.nextDeparture
                              ? `Next: ${formatDate(tour.nextDeparture)}`
                              : "No upcoming dates"}{" "}
                            ·{" "}
                            {plural(tour.upcomingDepartures ?? 0, "departure")}{" "}
                            · {plural(tour.upcomingGuests ?? 0, "guest")} booked
                            {tour.maxGroupSize
                              ? ` · max group ${tour.maxGroupSize}`
                              : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {tour.guides.length === 0 ? (
                          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                            Needs a guide
                          </span>
                        ) : (
                          <Badge tone="green">
                            {plural(tour.guides.length, "guide")}
                          </Badge>
                        )}
                        <Link
                          href={`/guide/tours/${tour._id}`}
                          className="text-sm font-semibold text-emerald-700 hover:underline"
                        >
                          View roster →
                        </Link>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {tour.guides.length === 0 && (
                        <span className="text-sm text-gray-500">
                          No guides yet
                        </span>
                      )}

                      {tour.guides.map((gid) => {
                        const g = guideById.get(gid);
                        const clash = g ? clashDays(g, tour) : null;
                        const chipKey = `${tour._id}:${gid}`;
                        const asking = confirming === chipKey;

                        return (
                          <span
                            key={gid}
                            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 py-1 pr-1 pl-1 text-xs font-semibold text-emerald-800"
                          >
                            <Avatar name={g?.name} photo={g?.photo} px={22} />
                            {g?.name ?? "Unknown guide"}
                            {g?.role === "lead-guide" && (
                              <Badge tone="blue">lead</Badge>
                            )}
                            {clash && clash.length > 0 && (
                              <span
                                title={`Unavailable on ${clash
                                  .map((d) => d.short)
                                  .join(", ")} (days this tour departs)`}
                                className="rounded-full bg-amber-100 px-1.5 text-[10px] font-bold text-amber-800"
                              >
                                ⚠ {clash.map((d) => d.short).join(", ")}
                              </span>
                            )}

                            {asking ? (
                              <span className="flex items-center gap-1 pl-1">
                                <span className="text-gray-700">Remove?</span>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => {
                                    setConfirming(null);
                                    setGuide.mutate({
                                      tourId: tour._id,
                                      guideId: gid,
                                      action: "unassign",
                                    });
                                  }}
                                  className="rounded-full bg-red-600 px-2 py-0.5 text-white hover:bg-red-700 disabled:opacity-50"
                                >
                                  Yes
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirming(null)}
                                  className="rounded-full px-2 py-0.5 text-gray-700 hover:bg-emerald-100"
                                >
                                  No
                                </button>
                              </span>
                            ) : (
                              <button
                                type="button"
                                aria-label={`Remove ${g?.name ?? "guide"} from ${tour.name}`}
                                disabled={busy}
                                onClick={() => setConfirming(chipKey)}
                                className="flex h-5 w-5 items-center justify-center rounded-full text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                              >
                                ×
                              </button>
                            )}
                          </span>
                        );
                      })}

                      {available.length > 0 && (
                        <select
                          aria-label={`Add a guide to ${tour.name}`}
                          value=""
                          disabled={busy}
                          onChange={(e) => {
                            if (!e.target.value) return;
                            setGuide.mutate({
                              tourId: tour._id,
                              guideId: e.target.value,
                              action: "assign",
                            });
                          }}
                          className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 disabled:opacity-50"
                        >
                          <option value="">+ Add guide…</option>
                          {available.map(({ g, clash }) => (
                            <option key={g._id} value={g._id}>
                              {g.name}
                              {g.role === "lead-guide" ? " (lead)" : ""}
                              {clash === null
                                ? " — availability not set"
                                : clash.length === 0
                                  ? " — available"
                                  : ` — unavailable ${clash
                                      .map((d) => d.short)
                                      .join(", ")}`}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          {/* BY GUIDE */}
          {view === "guides" && (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredGuides.length === 0 && (
                <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500 md:col-span-2">
                  {data.guides.length === 0
                    ? "There are no guides yet."
                    : "No guides match your search."}
                </p>
              )}

              {filteredGuides.map((g) => {
                const tours = toursByGuide.get(g._id) ?? [];
                const departures = tours.reduce(
                  (s, t) => s + (t.upcomingDepartures ?? 0),
                  0,
                );
                const days = DAYS.filter((d) => g.availability?.[d.key]).length;

                return (
                  <article
                    key={g._id}
                    className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar name={g.name} photo={g.photo} px={44} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-900">
                            {g.name}
                          </p>
                          <p className="truncate text-xs text-gray-500">
                            {g.email}
                          </p>
                        </div>
                      </div>
                      {g.role === "lead-guide" ? (
                        <Badge tone="blue">lead</Badge>
                      ) : tours.length === 0 ? (
                        <Badge tone="gray">free</Badge>
                      ) : null}
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <WeekStrip availability={g.availability} />
                      <p className="text-xs text-gray-500">
                        {days === 0
                          ? "Availability not set"
                          : `${days} of 7 days`}
                      </p>
                    </div>

                    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl bg-gray-50 px-3 py-2">
                        <dt className="text-xs text-gray-500">Tours</dt>
                        <dd className="font-bold text-gray-900">
                          {tours.length}
                        </dd>
                      </div>
                      <div className="rounded-xl bg-gray-50 px-3 py-2">
                        <dt className="text-xs text-gray-500">
                          Upcoming departures
                        </dt>
                        <dd className="font-bold text-gray-900">
                          {departures}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {tours.length === 0 ? (
                        <span className="text-sm text-gray-500">
                          Not assigned to any tour
                        </span>
                      ) : (
                        tours.map((t) => (
                          <Link
                            key={t._id}
                            href={`/guide/tours/${t._id}`}
                            className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 transition hover:border-emerald-300 hover:bg-emerald-50"
                          >
                            {t.name}
                          </Link>
                        ))
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
}
