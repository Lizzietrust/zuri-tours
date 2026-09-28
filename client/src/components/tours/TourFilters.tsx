"use client";

import { useCallback, useEffect, useState } from "react";
import type { TourFilters as Filters } from "@/types";

interface TourFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onReset: () => void;
}

const DIFFICULTIES = [
  { value: "", label: "Any difficulty" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "difficult", label: "Difficult" },
];

const SORTS = [
  { value: "-createdAt", label: "Newest first" },
  { value: "price", label: "Price: low → high" },
  { value: "-price", label: "Price: high → low" },
  { value: "-ratingsAverage", label: "Highest rated" },
  { value: "duration", label: "Shortest duration" },
  { value: "-duration", label: "Longest duration" },
  { value: "name", label: "Name A → Z" },
];

const RATINGS = [
  { value: "", label: "Any rating" },
  { value: "4.5", label: "4.5+ stars" },
  { value: "4", label: "4+ stars" },
  { value: "3", label: "3+ stars" },
];

export default function TourFilters({
  filters,
  onChange,
  onReset,
}: TourFiltersProps) {
  // Local debounced state for text/number inputs
  const [local, setLocal] = useState<Filters>(filters);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Sync external → local (e.g. when URL changes or reset is clicked)
  useEffect(() => {
    setLocal(filters);
  }, [filters]);

  // Debounce the search/price/duration inputs
  useEffect(() => {
    const t = setTimeout(() => {
      const changed =
        local.q !== filters.q ||
        local.minPrice !== filters.minPrice ||
        local.maxPrice !== filters.maxPrice ||
        local.maxDuration !== filters.maxDuration;

      if (changed) onChange(local);
    }, 400);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local.q, local.minPrice, local.maxPrice, local.maxDuration]);

  // Immediate for selects
  const handleSelect = useCallback(
    (key: keyof Filters) => (e: React.ChangeEvent<HTMLSelectElement>) => {
      const next = { ...local, [key]: e.target.value };
      setLocal(next);
      onChange(next);
    },
    [local, onChange],
  );

  const activeCount = [
    filters.q,
    filters.difficulty,
    filters.minPrice,
    filters.maxPrice,
    filters.minRating,
    filters.maxDuration,
    filters.category,
  ].filter(Boolean).length;

  return (
    <>
      {/* Mobile toggle */}
      <div className="mb-4 flex items-center justify-between lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <span>Filters</span>
          {activeCount > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-xs font-semibold text-white">
              {activeCount}
            </span>
          )}
        </button>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            Clear all
          </button>
        )}
      </div>

      <aside
        className={`${
          mobileOpen ? "block" : "hidden"
        } lg:block lg:sticky lg:top-6 lg:self-start`}
      >
        <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Filters
            </h2>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={onReset}
                className="hidden text-xs font-medium text-emerald-700 hover:text-emerald-800 lg:inline"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Search */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Search
            </label>
            <input
              type="search"
              value={local.q}
              onChange={(e) => setLocal({ ...local, q: e.target.value })}
              placeholder="Tour name, location…"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {/* Difficulty */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Difficulty
            </label>
            <select
              value={local.difficulty}
              onChange={handleSelect("difficulty")}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Price */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Price range
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={local.minPrice}
                onChange={(e) =>
                  setLocal({ ...local, minPrice: e.target.value })
                }
                placeholder="Min"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
              <span className="text-gray-400">–</span>
              <input
                type="number"
                min={0}
                value={local.maxPrice}
                onChange={(e) =>
                  setLocal({ ...local, maxPrice: e.target.value })
                }
                placeholder="Max"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Minimum rating
            </label>
            <select
              value={local.minRating}
              onChange={handleSelect("minRating")}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            >
              {RATINGS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Max duration (days)
            </label>
            <input
              type="number"
              min={1}
              value={local.maxDuration}
              onChange={(e) =>
                setLocal({ ...local, maxDuration: e.target.value })
              }
              placeholder="e.g. 7"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {/* Sort */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Sort by
            </label>
            <select
              value={local.sort}
              onChange={handleSelect("sort")}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </aside>
    </>
  );
}
