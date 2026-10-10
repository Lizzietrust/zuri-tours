"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { TourFilters as Filters } from "@/types";

interface TourFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onReset: () => void;
}

const DIFFICULTIES = [
  { value: "", label: "Any" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "difficult", label: "Difficult" },
];

const RATINGS = [
  { value: "", label: "Any" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
  { value: "4.5", label: "4.5+" },
];

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100";

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
        active
          ? "border-emerald-600 bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
          : "border-gray-200 bg-white text-gray-700 hover:border-emerald-300 hover:bg-emerald-50"
      }`}
    >
      {children}
    </button>
  );
}

function Section({
  title,
  children,
  first = false,
}: {
  title: string;
  children: ReactNode;
  first?: boolean;
}) {
  return (
    <div className={first ? "" : "border-t border-gray-100 pt-5"}>
      <h3 className="mb-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function TourFilters({
  filters,
  onChange,
  onReset,
}: TourFiltersProps) {
  const uid = useId();
  const [local, setLocal] = useState<Filters>(filters);
  const [mobileOpen, setMobileOpen] = useState(false);

  const lastExternal = useRef(JSON.stringify(filters));

  useEffect(() => {
    const serialized = JSON.stringify(filters);
    if (serialized !== lastExternal.current) {
      lastExternal.current = serialized;
      setLocal(filters);
    }
  }, [filters]);

  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const schedulePush = useCallback(
    (next: Filters) => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
      pushTimer.current = setTimeout(() => {
        lastExternal.current = JSON.stringify(next);
        onChange(next);
      }, 400);
    },
    [onChange],
  );

  useEffect(() => {
    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, []);

  const setDebounced = (patch: Partial<Filters>) => {
    const next = { ...filters, ...local, ...patch };
    setLocal(next);
    schedulePush(next);
  };

  const setImmediate = (patch: Partial<Filters>) => {
    if (pushTimer.current) clearTimeout(pushTimer.current);
    const next = { ...filters, ...local, ...patch };
    setLocal(next);
    lastExternal.current = JSON.stringify(next);
    onChange(next);
  };

  const activeCount = [
    filters.difficulty,
    filters.minPrice,
    filters.maxPrice,
    filters.minRating,
    filters.maxDuration,
  ].filter(Boolean).length;

  return (
    <>
      {/* Mobile toggle */}
      <div className="mb-4 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 shadow-sm"
        >
          <span className="inline-flex items-center gap-2">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-emerald-600"
              aria-hidden="true"
            >
              <path d="M3 5h18M6 12h12M10 19h4" />
            </svg>
            Filters
            {activeCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-xs font-bold text-white">
                {activeCount}
              </span>
            )}
          </span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`h-4 w-4 text-gray-400 transition-transform ${mobileOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>

      <aside
        className={`${mobileOpen ? "block" : "hidden"} lg:sticky lg:top-24 lg:block lg:self-start`}
      >
        <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="inline-flex items-center gap-2 text-base font-bold text-gray-900">
              Filters
              {activeCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-100 px-1.5 text-xs font-bold text-emerald-800">
                  {activeCount}
                </span>
              )}
            </h2>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={onReset}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
              >
                Clear all
              </button>
            )}
          </div>

          <Section title="Difficulty" first>
            <div className="flex flex-wrap gap-2">
              {DIFFICULTIES.map((d) => (
                <Pill
                  key={d.value || "any"}
                  active={local.difficulty === d.value}
                  onClick={() => setImmediate({ difficulty: d.value })}
                >
                  {d.label}
                </Pill>
              ))}
            </div>
          </Section>

          <Section title="Price range">
            <div className="flex items-center gap-2">
              <div className="relative w-full">
                <label htmlFor={`${uid}-min`} className="sr-only">
                  Minimum price
                </label>
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-gray-400">
                  $
                </span>
                <input
                  id={`${uid}-min`}
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={local.minPrice}
                  onChange={(e) => setDebounced({ minPrice: e.target.value })}
                  placeholder="Min"
                  className={`${inputClass} pr-3 pl-7`}
                />
              </div>
              <span className="text-gray-300" aria-hidden>
                –
              </span>
              <div className="relative w-full">
                <label htmlFor={`${uid}-max`} className="sr-only">
                  Maximum price
                </label>
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-gray-400">
                  $
                </span>
                <input
                  id={`${uid}-max`}
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={local.maxPrice}
                  onChange={(e) => setDebounced({ maxPrice: e.target.value })}
                  placeholder="Max"
                  className={`${inputClass} pr-3 pl-7`}
                />
              </div>
            </div>
          </Section>

          <Section title="Minimum rating">
            <div className="flex flex-wrap gap-2">
              {RATINGS.map((r) => (
                <Pill
                  key={r.value || "any"}
                  active={local.minRating === r.value}
                  onClick={() => setImmediate({ minRating: r.value })}
                >
                  {r.value ? (
                    <>
                      <span className="text-amber-400" aria-hidden>
                        ★
                      </span>{" "}
                      {r.label}
                    </>
                  ) : (
                    r.label
                  )}
                </Pill>
              ))}
            </div>
          </Section>

          <Section title="Max duration">
            <div className="relative">
              <label htmlFor={`${uid}-dur`} className="sr-only">
                Maximum duration in days
              </label>
              <input
                id={`${uid}-dur`}
                type="number"
                min={1}
                inputMode="numeric"
                value={local.maxDuration}
                onChange={(e) => setDebounced({ maxDuration: e.target.value })}
                placeholder="e.g. 7"
                className={`${inputClass} pr-14 pl-3`}
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-gray-400">
                days
              </span>
            </div>
          </Section>
        </div>
      </aside>
    </>
  );
}
