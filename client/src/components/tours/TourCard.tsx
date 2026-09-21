import Link from "next/link";
import type { Tour } from "@/types";
import { formatCurrency } from "@/lib/utils";

/* ---------- Difficulty badge ---------- */

const DIFFICULTY_STYLES: Record<Tour["difficulty"], string> = {
  easy: "bg-emerald-100 text-emerald-800",
  medium: "bg-amber-100 text-amber-800",
  difficult: "bg-rose-100 text-rose-800",
};

const DIFFICULTY_LABEL: Record<Tour["difficulty"], string> = {
  easy: "Easy",
  medium: "Moderate",
  difficult: "Challenging",
};

/* ---------- Tiny inline icons (no extra dependency) ---------- */

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

const ICONS = {
  clock: "M12 6v6l4 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
  users:
    "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  pin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z",
  check: "M20 6L9 17l-5-5",
} as const;

/* ---------- Star rating renderer ---------- */

function StarRating({ value, count }: { value: number; count: number }) {
  const rounded = Math.round(value * 2) / 2; // round to nearest 0.5

  return (
    <div className="flex items-center gap-1 text-sm">
      <div className="flex items-center gap-0.5 text-amber-500">
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = i <= Math.floor(rounded);
          const half = !filled && i === Math.ceil(rounded) && rounded % 1 !== 0;

          return (
            <svg
              key={i}
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5"
              aria-hidden="true"
            >
              {half ? (
                <>
                  <defs>
                    <linearGradient id={`half-${i}`}>
                      <stop offset="50%" stopColor="currentColor" />
                      <stop offset="50%" stopColor="#e5e7eb" />
                    </linearGradient>
                  </defs>
                  <path
                    fill={`url(#half-${i})`}
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"
                  />
                </>
              ) : (
                <path
                  fill={filled ? "currentColor" : "#e5e7eb"}
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"
                />
              )}
            </svg>
          );
        })}
      </div>
      <span className="font-semibold text-gray-800">{value.toFixed(1)}</span>
      <span className="text-gray-400">({count})</span>
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

  return (
    <Link
      href={`/tours/${tour.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg"
    >
      {/* ---------- Hero image ---------- */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-linear-to-br from-emerald-100 to-emerald-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`http://localhost:8000/img/tours/${tour.imageCover}`}
          alt={tour.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).style.opacity = "0";
          }}
        />

        {/* Overlay gradient */}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />

        {/* Difficulty badge */}
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm ${
            DIFFICULTY_STYLES[tour.difficulty]
          }`}
        >
          {DIFFICULTY_LABEL[tour.difficulty]}
        </span>

        {/* Discount badge */}
        {hasDiscount && (
          <span className="absolute right-3 top-3 rounded-full bg-rose-500 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
            -{discountPercent}%
          </span>
        )}

        {/* Title overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="line-clamp-2 text-lg font-bold text-white drop-shadow-sm">
            {tour.name}
          </h3>
        </div>
      </div>

      {/* ---------- Body ---------- */}
      <div className="flex flex-1 flex-col p-4">
        {/* Rating */}
        <div className="mb-3">
          <StarRating
            value={tour.ratingsAverage}
            count={tour.ratingsQuantity}
          />
        </div>

        {/* Summary */}
        <p className="mb-4 line-clamp-2 text-sm text-gray-600">
          {tour.summary}
        </p>

        {/* Meta grid */}
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

          {tour.location?.city && (
            <div className="col-span-2 flex items-center gap-1.5">
              <Icon path={ICONS.pin} className="h-3.5 w-3.5 text-emerald-600" />
              <span className="truncate">
                {tour.location.city}
                {tour.location.country ? `, ${tour.location.country}` : ""}
              </span>
            </div>
          )}
        </div>

        {/* User-reviewed flag */}
        {tour.hasUserReviewed && (
          <div className="mb-3 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-800">
            <Icon path={ICONS.check} className="h-3.5 w-3.5" />
            You reviewed this tour
          </div>
        )}

        {/* Price + CTA */}
        <div className="mt-auto flex items-end justify-between border-t border-gray-100 pt-3">
          <div className="flex flex-col">
            {hasDiscount ? (
              <>
                <span className="text-xs font-medium text-gray-400 line-through">
                  {formatCurrency(tour.price)}
                </span>
                <span className="text-lg font-bold text-emerald-700">
                  {formatCurrency(tour.priceDiscount!)}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-emerald-700">
                {formatCurrency(tour.price)}
              </span>
            )}
            <span className="text-[10px] uppercase tracking-wide text-gray-400">
              per person
            </span>
          </div>

          <span className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition group-hover:bg-emerald-700">
            View details
          </span>
        </div>
      </div>
    </Link>
  );
}
