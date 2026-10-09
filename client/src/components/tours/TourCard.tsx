"use client";

import Link from "next/link";
import { useId, type SyntheticEvent } from "react";
import type { Tour } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { imageUrl } from "@/services/tours";

const FALLBACK_IMG = "/placeholder-tour.jpg";

const DIFFICULTY_STYLES: Record<Tour["difficulty"], string> = {
  easy: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  medium: "bg-amber-100 text-amber-800 ring-amber-200",
  difficult: "bg-rose-100 text-rose-800 ring-rose-200",
};

const DIFFICULTY_LABEL: Record<Tour["difficulty"], string> = {
  easy: "Easy",
  medium: "Moderate",
  difficult: "Challenging",
};

const ICONS = {
  clock: "M12 6v6l4 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
  users:
    "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  pin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  check: "M20 6L9 17l-5-5",
} as const;

function Icon({
  path,
  className = "h-4 w-4",
}: {
  path: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

/* ---------- Star rating ---------- */

const STAR_PATH =
  "M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5.87-1.01L12 2z";

function StarRating({ value, count }: { value: number; count: number }) {
  const uid = useId().replace(/:/g, "");
  const safe = Number.isFinite(value) ? Math.min(5, Math.max(0, value)) : 0;
  const rounded = Math.round(safe * 2) / 2;

  return (
    <div
      className="flex items-center gap-1.5 text-sm"
      role="img"
      aria-label={
        safe
          ? `Rated ${safe.toFixed(1)} out of 5, ${count} reviews`
          : "No ratings yet"
      }
    >
      <div className="flex items-center gap-0.5 text-amber-500">
        {[1, 2, 3, 4, 5].map((i) => {
          const fill =
            i <= rounded ? "full" : i - 0.5 === rounded ? "half" : "empty";
          const gradientId = `half-${uid}-${i}`;

          return (
            <svg
              key={i}
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5"
              aria-hidden="true"
            >
              {fill === "half" && (
                <defs>
                  <linearGradient id={gradientId}>
                    <stop offset="50%" stopColor="currentColor" />
                    <stop offset="50%" stopColor="#e5e7eb" />
                  </linearGradient>
                </defs>
              )}
              <path
                d={STAR_PATH}
                fill={
                  fill === "full"
                    ? "currentColor"
                    : fill === "half"
                      ? `url(#${gradientId})`
                      : "#e5e7eb"
                }
              />
            </svg>
          );
        })}
      </div>
      <span className="font-semibold text-gray-800">
        {safe ? safe.toFixed(1) : "New"}
      </span>
      {count > 0 && <span className="text-gray-400">({count})</span>}
    </div>
  );
}

/* ---------- Card ---------- */

export default function TourCard({ tour }: { tour: Tour }) {
  const hasDiscount =
    typeof tour.priceDiscount === "number" &&
    tour.priceDiscount > 0 &&
    tour.priceDiscount < tour.price;

  const discountPercent = hasDiscount
    ? Math.round(((tour.price - tour.priceDiscount!) / tour.price) * 100)
    : 0;

  const city = tour.location?.city;
  const country = tour.location?.country;

  const handleImgError = (e: SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    img.onerror = null;
    img.src = FALLBACK_IMG;
  };

  return (
    <Link
      href={`/tours/${tour.slug}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
    >
      {/* Image */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-linear-to-br from-emerald-100 to-emerald-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl(tour.imageCover)}
          alt={tour.name}
          loading="lazy"
          decoding="async"
          onError={handleImgError}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-black/10" />

        <span
          className={`absolute top-3 left-3 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm ring-1 ${DIFFICULTY_STYLES[tour.difficulty] ?? DIFFICULTY_STYLES.medium}`}
        >
          {DIFFICULTY_LABEL[tour.difficulty] ?? tour.difficulty}
        </span>

        {hasDiscount && (
          <span className="absolute top-3 right-3 rounded-full bg-rose-500 px-2.5 py-0.5 text-xs font-bold text-white shadow-md">
            −{discountPercent}%
          </span>
        )}

        {tour.category && (
          <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-gray-700 uppercase backdrop-blur">
            {tour.category}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 min-h-14 text-lg leading-7 font-bold text-gray-900 transition-colors group-hover:text-emerald-700">
          {tour.name}
        </h3>

        <div className="mt-1 mb-3">
          <StarRating
            value={tour.ratingsAverage}
            count={tour.ratingsQuantity}
          />
        </div>

        <p className="mb-4 line-clamp-2 text-sm text-gray-600">
          {tour.summary}
        </p>

        <div className="mb-4 grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
            <Icon path={ICONS.clock} className="h-3.5 w-3.5 text-emerald-600" />
            <span>
              {tour.duration} {tour.duration === 1 ? "day" : "days"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Icon path={ICONS.users} className="h-3.5 w-3.5 text-emerald-600" />
            <span>Max {tour.maxGroupSize}</span>
          </div>

          {city && (
            <div className="col-span-2 flex items-center gap-1.5">
              <Icon path={ICONS.pin} className="h-3.5 w-3.5 text-emerald-600" />
              <span className="truncate">
                {city}
                {country ? `, ${country}` : ""}
              </span>
            </div>
          )}

          {typeof tour.distance === "number" && (
            <div className="col-span-2 flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="truncate">
                {tour.distance.toFixed(1)} {tour.distanceUnit ?? "km"} away
              </span>
            </div>
          )}
        </div>

        {tour.hasUserReviewed && (
          <div className="mb-3 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-800">
            <Icon path={ICONS.check} className="h-3.5 w-3.5" />
            You reviewed this tour
          </div>
        )}

        {/* Price + CTA */}
        <div className="mt-auto flex items-end justify-between border-t border-gray-100 pt-3">
          <div className="flex flex-col">
            {hasDiscount && (
              <span className="text-xs font-medium text-gray-400 line-through">
                {formatCurrency(tour.price)}
              </span>
            )}
            <span className="text-lg font-bold text-emerald-700">
              {formatCurrency(hasDiscount ? tour.priceDiscount! : tour.price)}
            </span>
            <span className="text-[10px] tracking-wide text-gray-400 uppercase">
              per person
            </span>
          </div>

          <span className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition group-hover:bg-emerald-700">
            View details →
          </span>
        </div>
      </div>
    </Link>
  );
}
