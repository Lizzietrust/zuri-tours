"use client";

import type { TourFilters } from "@/types";

interface Props {
  filters: TourFilters;
  onChange: (filters: TourFilters) => void;
  onReset: () => void;
}

interface Chip {
  key: keyof TourFilters;
  label: string;
  clearTo: string;
}

export default function ActiveFilterChips({
  filters,
  onChange,
  onReset,
}: Props) {
  const chips: Chip[] = [];

  if (filters.q) {
    chips.push({ key: "q", label: `"${filters.q}"`, clearTo: "" });
  }
  if (filters.difficulty) {
    chips.push({
      key: "difficulty",
      label: filters.difficulty,
      clearTo: "",
    });
  }
  if (filters.minPrice || filters.maxPrice) {
    const label = `$${filters.minPrice || "0"} – $${filters.maxPrice || "∞"}`;
    chips.push({ key: "minPrice", label, clearTo: "" });
  }
  if (filters.minRating) {
    chips.push({
      key: "minRating",
      label: `${filters.minRating}★+`,
      clearTo: "",
    });
  }
  if (filters.maxDuration) {
    chips.push({
      key: "maxDuration",
      label: `≤ ${filters.maxDuration} days`,
      clearTo: "",
    });
  }
  if (filters.category) {
    chips.push({ key: "category", label: filters.category, clearTo: "" });
  }

  if (chips.length === 0) return null;

  const remove = (chip: Chip) => {
    if (chip.key === "minPrice") {
      onChange({ ...filters, minPrice: "", maxPrice: "" });
    } else {
      onChange({ ...filters, [chip.key]: chip.clearTo });
    }
  };

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800"
        >
          {chip.label}
          <button
            type="button"
            onClick={() => remove(chip)}
            aria-label={`Remove ${chip.label}`}
            className="ml-1 rounded-full text-emerald-700 hover:text-emerald-900"
          >
            ×
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onReset}
        className="text-xs font-medium text-gray-500 hover:text-gray-700"
      >
        Clear all
      </button>
    </div>
  );
}
