"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { BTN, INPUT } from "@/components/admin/ui";

/* eslint-disable @typescript-eslint/no-explicit-any */
type TourDoc = Record<string, any>;

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const CATEGORIES = [
  "adventure",
  "cultural",
  "nature",
  "city",
  "beach",
  "mountain",
];
const DIFFICULTIES = ["easy", "medium", "difficult"];

function Field({
  label,
  hint,
  className = "",
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
    </label>
  );
}

export default function TourForm({
  initial,
  submitting,
  onSubmit,
}: {
  initial?: TourDoc;
  submitting: boolean;
  onSubmit: (payload: Record<string, unknown>) => void;
}) {
  const editing = !!initial;
  const [slugTouched, setSlugTouched] = useState(editing);
  const [f, setF] = useState({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    summary: initial?.summary ?? "",
    description: initial?.description ?? "",
    duration: String(initial?.duration ?? ""),
    maxGroupSize: String(initial?.maxGroupSize ?? ""),
    difficulty: initial?.difficulty ?? "easy",
    category: initial?.category ?? "adventure",
    price: String(initial?.price ?? ""),
    priceDiscount:
      initial?.priceDiscount != null ? String(initial.priceDiscount) : "",
    imageCover: initial?.imageCover ?? "",
    featured: !!initial?.featured,
    startDates: (initial?.startDates ?? [])
      .map((d: string) => d.slice(0, 10))
      .join(", "),
    address: initial?.location?.address ?? "",
    city: initial?.location?.city ?? "",
    country: initial?.location?.country ?? "",
    lng:
      initial?.location?.coordinates?.[0] != null
        ? String(initial.location.coordinates[0])
        : "",
    lat:
      initial?.location?.coordinates?.[1] != null
        ? String(initial.location.coordinates[1])
        : "",
  });

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) =>
    setF((p) => ({ ...p, [k]: v }));

  const fail = (description: string) =>
    toast.error("Check the form", { description });

  const submit = (e: FormEvent) => {
    e.preventDefault();

    const num = (v: string) => (v.trim() === "" ? NaN : Number(v));
    const duration = num(f.duration);
    const maxGroupSize = num(f.maxGroupSize);
    const price = num(f.price);
    const lat = num(f.lat);
    const lng = num(f.lng);
    const discount = num(f.priceDiscount);

    if (f.name.trim().length < 3)
      return fail("Name must be at least 3 characters.");
    if (!f.slug.trim()) return fail("Slug is required.");
    if (!f.summary.trim() || f.summary.length > 200)
      return fail("Summary is required (max 200 characters).");
    if (!Number.isFinite(duration) || duration < 1)
      return fail("Duration must be at least 1 day.");
    if (!Number.isFinite(maxGroupSize) || maxGroupSize < 1)
      return fail("Max group size must be at least 1.");
    if (!Number.isFinite(price) || price < 0)
      return fail("Enter a valid price.");
    if (Number.isFinite(discount) && discount >= price)
      return fail("Discount price must be below the regular price.");
    if (!f.imageCover.trim()) return fail("Cover image is required.");
    if (!f.address.trim()) return fail("Address is required.");
    if (!Number.isFinite(lat) || lat < -90 || lat > 90)
      return fail("Latitude must be between -90 and 90.");
    if (!Number.isFinite(lng) || lng < -180 || lng > 180)
      return fail("Longitude must be between -180 and 180.");

    const dates = f.startDates
      .split(/[,\n]/)
      .map((d: string) => d.trim())
      .filter(Boolean);
    const startDates: string[] = [];

    for (const d of dates) {
      const parsed = new Date(`${d}T00:00:00.000Z`);

      if (Number.isNaN(parsed.getTime()))
        return fail(`"${d}" is not a valid date (use YYYY-MM-DD).`);
      startDates.push(parsed.toISOString());
    }

    /* keep any other location fields (region, postalCode…) when editing */
    const {
      lat: _lat,
      lng: _lng,
      _id,
      ...existingLocation
    } = initial?.location ?? {};

    onSubmit({
      name: f.name.trim(),
      slug: f.slug.trim(),
      summary: f.summary.trim(),
      description: f.description.trim(),
      duration,
      maxGroupSize,
      difficulty: f.difficulty,
      category: f.category,
      price,
      priceDiscount: Number.isFinite(discount)
        ? discount
        : editing
          ? null
          : undefined,
      imageCover: f.imageCover.trim(),
      featured: f.featured,
      startDates,
      location: {
        ...existingLocation,
        type: "Point",
        coordinates: [lng, lat],
        address: f.address.trim(),
        city: f.city.trim(),
        country: f.country.trim(),
      },
    });
  };

  return (
    <form
      onSubmit={submit}
      noValidate
      className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name">
          <input
            className={`${INPUT} w-full`}
            value={f.name}
            maxLength={100}
            onChange={(e) => {
              set("name", e.target.value);
              if (!slugTouched) set("slug", slugify(e.target.value));
            }}
          />
        </Field>
        <Field label="Slug" hint="Used in the tour URL.">
          <input
            className={`${INPUT} w-full`}
            value={f.slug}
            onChange={(e) => {
              setSlugTouched(true);
              set("slug", slugify(e.target.value));
            }}
          />
        </Field>
        <Field
          label={`Summary (${f.summary.length}/200)`}
          className="sm:col-span-2"
        >
          <input
            className={`${INPUT} w-full`}
            value={f.summary}
            maxLength={200}
            onChange={(e) => set("summary", e.target.value)}
          />
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <textarea
            rows={5}
            className={`${INPUT} w-full`}
            value={f.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </Field>
        <Field label="Duration (days)">
          <input
            type="number"
            min={1}
            className={`${INPUT} w-full`}
            value={f.duration}
            onChange={(e) => set("duration", e.target.value)}
          />
        </Field>
        <Field label="Max group size">
          <input
            type="number"
            min={1}
            className={`${INPUT} w-full`}
            value={f.maxGroupSize}
            onChange={(e) => set("maxGroupSize", e.target.value)}
          />
        </Field>
        <Field label="Difficulty">
          <select
            className={`${INPUT} w-full`}
            value={f.difficulty}
            onChange={(e) => set("difficulty", e.target.value)}
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Category">
          <select
            className={`${INPUT} w-full`}
            value={f.category}
            onChange={(e) => set("category", e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Price (USD)">
          <input
            type="number"
            min={0}
            className={`${INPUT} w-full`}
            value={f.price}
            onChange={(e) => set("price", e.target.value)}
          />
        </Field>
        <Field label="Discount price (optional)">
          <input
            type="number"
            min={0}
            className={`${INPUT} w-full`}
            value={f.priceDiscount}
            onChange={(e) => set("priceDiscount", e.target.value)}
          />
        </Field>
        <Field
          label="Cover image"
          hint="Image URL or the filename stored on your server."
          className="sm:col-span-2"
        >
          <input
            className={`${INPUT} w-full`}
            value={f.imageCover}
            onChange={(e) => set("imageCover", e.target.value)}
          />
        </Field>
        <Field
          label="Start dates"
          hint="Comma-separated, YYYY-MM-DD. e.g. 2027-01-15, 2027-02-10"
          className="sm:col-span-2"
        >
          <input
            className={`${INPUT} w-full`}
            value={f.startDates}
            onChange={(e) => set("startDates", e.target.value)}
          />
        </Field>
      </div>

      <h3 className="border-t border-gray-100 pt-5 text-sm font-semibold uppercase tracking-wide text-gray-500">
        Location
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Address" className="sm:col-span-2">
          <input
            className={`${INPUT} w-full`}
            value={f.address}
            onChange={(e) => set("address", e.target.value)}
          />
        </Field>
        <Field label="City">
          <input
            className={`${INPUT} w-full`}
            value={f.city}
            onChange={(e) => set("city", e.target.value)}
          />
        </Field>
        <Field label="Country">
          <input
            className={`${INPUT} w-full`}
            value={f.country}
            onChange={(e) => set("country", e.target.value)}
          />
        </Field>
        <Field label="Latitude">
          <input
            type="number"
            step="any"
            className={`${INPUT} w-full`}
            value={f.lat}
            onChange={(e) => set("lat", e.target.value)}
          />
        </Field>
        <Field label="Longitude">
          <input
            type="number"
            step="any"
            className={`${INPUT} w-full`}
            value={f.lng}
            onChange={(e) => set("lng", e.target.value)}
          />
        </Field>
      </div>

      <label className="flex w-fit items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={f.featured}
          onChange={(e) => set("featured", e.target.checked)}
          className="h-4 w-4 accent-emerald-600"
        />
        Feature this tour on the home page
      </label>

      <div className="flex gap-3">
        <button type="submit" disabled={submitting} className={BTN.primary}>
          {submitting ? "Saving…" : editing ? "Save changes" : "Create tour"}
        </button>
      </div>
    </form>
  );
}
