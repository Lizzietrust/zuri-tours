"use client";

import type { TourFilters } from "@/types";

interface Props {
  filters: TourFilters;
  onChange: (filters: TourFilters) => void;
  onReset: () => void;
}

interface Chip {
  id: string;
  label: string;
  clear: Partial<TourFilters>;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function ActiveFilterChips({
  filters,
  onChange,
  onReset,
}: Props) {
  const chips: Chip[] = [];

  if (filters.q) {
    chips.push({ id: "q", label: `“${filters.q}”`, clear: { q: "" } });
  }
  if (filters.category) {
    chips.push({
      id: "category",
      label: cap(filters.category),
      clear: { category: "" },
    });
  }
  if (filters.difficulty) {
    chips.push({
      id: "difficulty",
      label: cap(filters.difficulty),
      clear: { difficulty: "" },
    });
  }
  if (filters.minPrice || filters.maxPrice) {
    chips.push({
      id: "price",
      label: `$${filters.minPrice || "0"} – ${filters.maxPrice ? `$${filters.maxPrice}` : "any"}`,
      clear: { minPrice: "", maxPrice: "" },
    });
  }
  if (filters.minRating) {
    chips.push({
      id: "rating",
      label: `★ ${filters.minRating}+`,
      clear: { minRating: "" },
    });
  }
  if (filters.maxDuration) {
    chips.push({
      id: "duration",
      label: `≤ ${filters.maxDuration} ${filters.maxDuration === "1" ? "day" : "days"}`,
      clear: { maxDuration: "" },
    });
  }

  if (chips.length === 0) return null;

  return (
    <div
      className="mb-5 flex flex-wrap items-center gap-2"
      role="group"
      aria-label="Active filters"
    >
      {chips.map((chip) => (
        <span
          key={chip.id}
          className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white py-1 pr-1.5 pl-3 text-xs font-semibold text-emerald-800 shadow-sm"
        >
          {chip.label}
          <button
            type="button"
            onClick={() => onChange({ ...filters, ...chip.clear })}
            aria-label={`Remove filter ${chip.label}`}
            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-emerald-700 transition hover:bg-emerald-100 hover:text-emerald-900 focus-visible:outline-2 focus-visible:outline-emerald-600"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              className="h-3 w-3"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </span>
      ))}

      <button
        type="button"
        onClick={onReset}
        className="ml-1 text-xs font-semibold text-gray-500 underline-offset-2 hover:text-gray-800 hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}
