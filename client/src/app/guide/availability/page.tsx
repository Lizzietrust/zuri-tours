"use client";

import { useState } from "react";
import { useGuideDashboard, useUpdateAvailability } from "@/hooks/useGuide";
import { BTN, PageHeader } from "@/components/admin/ui";
import type { Availability } from "@/services/guide";

const DAYS: { key: keyof Availability; label: string }[] = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

export default function AvailabilityPage() {
  const { data, isLoading } = useGuideDashboard();
  const save = useUpdateAvailability();
  const [draft, setDraft] = useState<Partial<Availability>>({});

  const base = data?.availability ?? {};
  const value = (k: keyof Availability) => draft[k] ?? base[k] ?? false;
  const dirty = DAYS.some(({ key }) => value(key) !== (base[key] ?? false));

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
        subtitle="Tell your lead guide which days you can work"
      />

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <ul className="space-y-2">
            {DAYS.map(({ key, label }) => (
              <li key={key}>
                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-800 transition hover:border-emerald-200">
                  {label}
                  <input
                    type="checkbox"
                    checked={value(key)}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, [key]: e.target.checked }))
                    }
                    className="h-4 w-4 accent-emerald-600"
                  />
                </label>
              </li>
            ))}
          </ul>

          <button
            className={`${BTN.primary} mt-5`}
            disabled={!dirty || save.isPending}
            onClick={onSave}
          >
            {save.isPending ? "Saving…" : "Save availability"}
          </button>
        </div>
      )}
    </>
  );
}
