"use client";

import { useMemo, useState } from "react";
import { useGuideDashboard, useUpdateAvailability } from "@/hooks/useGuide";
import { BTN, PageHeader } from "@/components/admin/ui";
import type { Availability } from "@/services/guide";

type DayKey = keyof Availability;

const DAYS: { key: DayKey; label: string; short: string; weekend: boolean }[] =
  [
    { key: "monday", label: "Monday", short: "Mon", weekend: false },
    { key: "tuesday", label: "Tuesday", short: "Tue", weekend: false },
    { key: "wednesday", label: "Wednesday", short: "Wed", weekend: false },
    { key: "thursday", label: "Thursday", short: "Thu", weekend: false },
    { key: "friday", label: "Friday", short: "Fri", weekend: false },
    { key: "saturday", label: "Saturday", short: "Sat", weekend: true },
    { key: "sunday", label: "Sunday", short: "Sun", weekend: true },
  ];

const PRESETS: {
  label: string;
  apply: (d: (typeof DAYS)[number]) => boolean;
}[] = [
  { label: "Weekdays", apply: (d) => !d.weekend },
  { label: "Weekends", apply: (d) => d.weekend },
  { label: "Every day", apply: () => true },
  { label: "Clear all", apply: () => false },
];

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="relative inline-flex cursor-pointer items-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
        className="peer sr-only"
      />
      <span className="h-6 w-11 rounded-full bg-gray-300 transition peer-checked:bg-emerald-600 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500 peer-focus-visible:ring-offset-2" />
      <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
    </label>
  );
}

export default function AvailabilityPage() {
  const { data, isLoading, isError, refetch } = useGuideDashboard();
  const save = useUpdateAvailability();
  const [draft, setDraft] = useState<Partial<Availability>>({});

  const base = useMemo(() => data?.availability ?? {}, [data]);
  const departureDays = data?.departureDays ?? {};

  const value = (k: DayKey) => draft[k] ?? base[k] ?? false;
  const dirty = DAYS.some(({ key }) => value(key) !== (base[key] ?? false));

  const selected = DAYS.filter(({ key }) => value(key));
  const selectedCount = selected.length;

  /* Days switched off that still have upcoming departures */
  const conflicts = DAYS.filter(
    ({ key }) => !value(key) && (departureDays[key] ?? 0) > 0,
  );
  const conflictTotal = conflicts.reduce(
    (s, { key }) => s + (departureDays[key] ?? 0),
    0,
  );

  const setDay = (k: DayKey, v: boolean) => setDraft((d) => ({ ...d, [k]: v }));

  const applyPreset = (fn: (d: (typeof DAYS)[number]) => boolean) =>
    setDraft(Object.fromEntries(DAYS.map((d) => [d.key, fn(d)])));

  const onSave = () => {
    const payload = Object.fromEntries(
      DAYS.map(({ key }) => [key, value(key)]),
    ) as Availability;

    save.mutate(payload, { onSuccess: () => setDraft({}) });
  };

  return (
    <>
      <PageHeader
        title="Availability"
        subtitle="Tell your lead guide which days of the week you can work"
      />

      {isLoading && (
        <div className="animate-pulse space-y-4" aria-busy="true">
          <div className="h-28 rounded-2xl bg-gray-100" />
          <div className="h-80 rounded-2xl bg-gray-100" />
        </div>
      )}

      {isError && (
        <button
          onClick={() => refetch()}
          className="text-sm font-semibold text-emerald-700"
        >
          Couldn&apos;t load your availability — try again
        </button>
      )}

      {data && (
        <div className="grid gap-6 pb-24 lg:grid-cols-3">
          {/* Left: editor */}
          <div className="space-y-6 lg:col-span-2">
            {/* Summary */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Your week
                  </p>
                  <p className="mt-1 text-2xl font-extrabold text-gray-900">
                    {selectedCount === 0
                      ? "Not available any day"
                      : `Available ${selectedCount} of 7 days`}
                  </p>
                </div>
                {dirty && (
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                    Unsaved changes
                  </span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-7 gap-2" aria-hidden>
                {DAYS.map(({ key, short }) => (
                  <div
                    key={key}
                    className={`rounded-lg py-2 text-center text-xs font-bold transition ${
                      value(key)
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {short}
                  </div>
                ))}
              </div>
            </section>

            {/* Conflict warning */}
            {conflicts.length > 0 && (
              <div
                role="status"
                className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
              >
                <p className="font-semibold">
                  {plural(conflictTotal, "upcoming departure")} fall
                  {conflictTotal === 1 ? "s" : ""} on days you&apos;ve marked
                  unavailable
                </p>
                <p className="mt-1">
                  {conflicts
                    .map(
                      ({ label, key }) =>
                        `${label} (${departureDays[key] ?? 0})`,
                    )
                    .join(", ")}
                  . Your lead guide may need to reassign these, so let them know
                  early.
                </p>
              </div>
            )}

            {/* Day toggles */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-gray-900">
                  Days you can work
                </h2>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => applyPreset(p.apply)}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-700 transition hover:border-emerald-300 hover:bg-emerald-50"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <ul className="space-y-2">
                {DAYS.map(({ key, label, weekend }) => {
                  const on = value(key);
                  const count = departureDays[key] ?? 0;

                  return (
                    <li
                      key={key}
                      className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition ${
                        on
                          ? "border-emerald-200 bg-emerald-50/50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900">
                          {label}
                          {weekend && (
                            <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                              Weekend
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          {count > 0
                            ? `${plural(count, "upcoming departure")} on this day`
                            : "No upcoming departures on this day"}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs font-semibold ${
                            on ? "text-emerald-700" : "text-gray-400"
                          }`}
                        >
                          {on ? "Available" : "Off"}
                        </span>
                        <Switch
                          checked={on}
                          onChange={(v) => setDay(key, v)}
                          label={`${label} availability`}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>

          {/* Right: info */}
          <aside className="space-y-6">
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900">Overview</h2>
              <dl className="mt-3 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Days available</dt>
                  <dd className="font-semibold text-gray-900">
                    {selectedCount} / 7
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Weekdays</dt>
                  <dd className="font-semibold text-gray-900">
                    {selected.filter((d) => !d.weekend).length} / 5
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Weekend days</dt>
                  <dd className="font-semibold text-gray-900">
                    {selected.filter((d) => d.weekend).length} / 2
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Assigned tours</dt>
                  <dd className="font-semibold text-gray-900">
                    {data.stats.assignedTours}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Upcoming departures</dt>
                  <dd className="font-semibold text-gray-900">
                    {data.stats.upcomingDepartures}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-600 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900">
                How this works
              </h2>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>
                  Your lead guide uses this to decide which departures to assign
                  you to.
                </li>
                <li>
                  Switching a day off does not remove you from tours you&apos;re
                  already assigned to.
                </li>
                <li>
                  This is a weekly pattern. Tell your lead guide directly about
                  one-off days off.
                </li>
              </ul>
            </section>
          </aside>
        </div>
      )}

      {/* Save bar: only shown when there is something to save */}
      {data && dirty && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
            <p className="text-sm font-medium text-gray-700">
              You have unsaved changes
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDraft({})}
                disabled={save.isPending}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Reset
              </button>
              <button
                type="button"
                className={BTN.primary}
                disabled={save.isPending}
                onClick={onSave}
              >
                {save.isPending ? "Saving…" : "Save availability"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
