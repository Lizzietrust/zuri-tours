"use client";

import {
  Suspense,
  useCallback,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useTour } from "@/hooks/useTours";
import { imageUrl } from "@/services/tours";
import { formatCurrency } from "@/lib/utils";
import { formatDistance } from "@/lib/geo";
import type { Tour } from "@/types";

/* ---------- Constants ---------- */

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
  calendar:
    "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  check: "M20 6L9 17l-5-5",
  arrowLeft: "M19 12H5M12 19l-7-7 7-7",
  share: "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13",
  heart:
    "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
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

function StarRating({
  value,
  count,
  size = "md",
}: {
  value: number;
  count: number;
  size?: "sm" | "md" | "lg";
}) {
  const safe = Number.isFinite(value) ? Math.min(5, Math.max(0, value)) : 0;
  const rounded = Math.round(safe * 2) / 2;
  const starSize =
    size === "lg" ? "h-5 w-5" : size === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <div
      className="flex items-center gap-2"
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
          const gradientId = `star-${i}-${Math.random().toString(36).slice(2)}`;

          return (
            <svg
              key={i}
              viewBox="0 0 24 24"
              className={starSize}
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
      {count > 0 && (
        <span className="text-gray-500">
          ({count} {count === 1 ? "review" : "reviews"})
        </span>
      )}
    </div>
  );
}

/* ---------- Sub-components ---------- */

function ImageGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const [imgError, setImgError] = useState(false);

  const displayImages = useMemo(
    () => (images.length > 0 ? images : [FALLBACK_IMG]),
    [images],
  );

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative aspect-16/10 w-full overflow-hidden rounded-2xl bg-gray-100">
        {!imgError ? (
          <img
            src={imageUrl(displayImages[active])}
            alt={`${name} - image ${active + 1}`}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-100">
            <span className="text-4xl" aria-hidden>
              🖼️
            </span>
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {displayImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {displayImages.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setActive(i);
                setImgError(false);
              }}
              aria-label={`View image ${i + 1}`}
              aria-current={i === active}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                i === active
                  ? "border-emerald-600 ring-2 ring-emerald-200"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <img
                src={imageUrl(img)}
                alt=""
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BookingCard({ tour }: { tour: Tour }) {
  const hasDiscount =
    typeof tour.priceDiscount === "number" &&
    tour.priceDiscount > 0 &&
    tour.priceDiscount < tour.price;

  const discountPercent = hasDiscount
    ? Math.round(((tour.price - tour.priceDiscount!) / tour.price) * 100)
    : 0;

  const [guests, setGuests] = useState(2);
  const [date, setDate] = useState(tour.startDates?.[0]?.slice(0, 10) ?? "");

  const totalPrice = (hasDiscount ? tour.priceDiscount! : tour.price) * guests;

  const handleBook = (e: FormEvent) => {
    e.preventDefault();
    // TODO: wire to your booking API
    alert(
      `Booking ${guests} ${guests === 1 ? "guest" : "guests"} for "${tour.name}"${
        date ? ` on ${date}` : ""
      } — $${totalPrice}`,
    );
  };

  return (
    <form
      onSubmit={handleBook}
      className="sticky top-24 space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-lg shadow-emerald-900/5"
    >
      {/* Price */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col">
          {hasDiscount && (
            <span className="text-sm font-medium text-gray-400 line-through">
              {formatCurrency(tour.price)}
            </span>
          )}
          <span className="text-3xl font-extrabold text-emerald-700">
            {formatCurrency(hasDiscount ? tour.priceDiscount! : tour.price)}
          </span>
          <span className="text-xs tracking-wide text-gray-400 uppercase">
            per person
          </span>
        </div>
        {hasDiscount && (
          <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-700">
            −{discountPercent}%
          </span>
        )}
      </div>

      {/* Date picker */}
      <div>
        <label
          htmlFor="booking-date"
          className="mb-1 block text-xs font-semibold text-gray-600"
        >
          Select date
        </label>
        <input
          id="booking-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          min={new Date().toISOString().slice(0, 10)}
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100"
        />
      </div>

      {/* Guests */}
      <div>
        <label
          htmlFor="booking-guests"
          className="mb-1 block text-xs font-semibold text-gray-600"
        >
          Guests
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setGuests((g) => Math.max(1, g - 1))}
            aria-label="Decrease guests"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-lg font-semibold text-gray-700 transition hover:border-emerald-300 hover:bg-emerald-50"
          >
            −
          </button>
          <input
            id="booking-guests"
            type="number"
            min={1}
            max={tour.maxGroupSize}
            value={guests}
            onChange={(e) =>
              setGuests(
                Math.min(
                  tour.maxGroupSize,
                  Math.max(1, Number(e.target.value) || 1),
                ),
              )
            }
            className="w-16 rounded-lg border border-gray-200 py-2 text-center text-sm font-semibold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
          <button
            type="button"
            onClick={() => setGuests((g) => Math.min(tour.maxGroupSize, g + 1))}
            aria-label="Increase guests"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-lg font-semibold text-gray-700 transition hover:border-emerald-300 hover:bg-emerald-50"
          >
            +
          </button>
          <span className="text-xs text-gray-400">max {tour.maxGroupSize}</span>
        </div>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3">
        <span className="text-sm font-semibold text-emerald-900">Total</span>
        <span className="text-xl font-extrabold text-emerald-700">
          {formatCurrency(totalPrice)}
        </span>
      </div>

      <button
        type="submit"
        className="w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
      >
        Book now
      </button>

      <p className="text-center text-xs text-gray-400">
        Free cancellation up to 24h before
      </p>
    </form>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
        <Icon path={icon} className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium tracking-wide text-gray-400 uppercase">
          {label}
        </p>
        <p className="truncate text-sm font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

/* ---------- Loading skeleton ---------- */

function TourDetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-6 py-12">
      <div className="h-4 w-32 rounded bg-gray-200" />
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <div className="aspect-16/10 w-full rounded-2xl bg-gray-200" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 w-24 rounded-lg bg-gray-200" />
            ))}
          </div>
          <div className="h-10 w-3/4 rounded bg-gray-200" />
          <div className="h-5 w-1/2 rounded bg-gray-200" />
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-2/3 rounded bg-gray-200" />
          </div>
        </div>
        <div className="h-96 rounded-2xl bg-gray-200" />
      </div>
    </div>
  );
}

/* ---------- Error state ---------- */

function TourError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center">
      <span className="text-5xl" aria-hidden>
        🧭
      </span>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">Tour not found</h1>
      <p className="mt-2 text-sm text-gray-600">{message}</p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Try again
        </button>
        <Link
          href="/tours"
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Browse all tours
        </Link>
      </div>
    </div>
  );
}

/* ---------- Main content ---------- */

function TourDetailContent() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params?.slug ?? "";

  const { data: tour, isLoading, isError, error, refetch } = useTour(slug);

  const handleBack = useCallback(() => {
    if (window.history.length > 1) router.back();
    else router.push("/tours");
  }, [router]);

  const city = tour?.location?.city;
  const country = tour?.location?.country;
  const hasDistance =
    typeof tour?.distance === "number" && Number.isFinite(tour.distance);

  if (isLoading) return <TourDetailSkeleton />;

  if (isError || !tour) {
    const message =
      (error as { message?: string } | null)?.message ??
      "We couldn't load this tour. It may have been removed.";
    return <TourError message={message} onRetry={() => refetch()} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ---------- Hero strip ---------- */}
      <section className="border-b border-gray-100 bg-linear-to-br from-emerald-50 via-white to-sky-50">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 transition hover:text-emerald-800"
          >
            <Icon path={ICONS.arrowLeft} className="h-4 w-4" />
            Back to tours
          </button>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
                DIFFICULTY_STYLES[tour.difficulty] ?? DIFFICULTY_STYLES.medium
              }`}
            >
              {DIFFICULTY_LABEL[tour.difficulty] ?? tour.difficulty}
            </span>
            {tour.category && (
              <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold tracking-wide text-gray-700 uppercase ring-1 ring-gray-200">
                {tour.category}
              </span>
            )}
            {hasDistance && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200 backdrop-blur">
                <span aria-hidden>📍</span>
                {formatDistance(tour.distance!)} away
              </span>
            )}
          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-balance text-gray-900 sm:text-4xl">
            {tour.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
            <StarRating
              value={tour.ratingsAverage}
              count={tour.ratingsQuantity}
            />
            {(city || country) && (
              <span className="inline-flex items-center gap-1.5">
                <Icon path={ICONS.pin} className="h-4 w-4 text-emerald-600" />
                {city}
                {country ? `, ${country}` : ""}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Icon path={ICONS.clock} className="h-4 w-4 text-emerald-600" />
              {tour.duration} {tour.duration === 1 ? "day" : "days"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon path={ICONS.users} className="h-4 w-4 text-emerald-600" />
              Max {tour.maxGroupSize} guests
            </span>
          </div>
        </div>
      </section>

      {/* ---------- Main grid ---------- */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
          {/* Left column */}
          <div className="space-y-10">
            {/* Gallery */}
            <ImageGallery
              images={[tour.imageCover, ...(tour.images ?? [])].filter(Boolean)}
              name={tour.name}
            />

            {/* Summary */}
            {tour.summary && (
              <div>
                <h2 className="text-xl font-bold text-gray-900">Overview</h2>
                <p className="mt-2 text-base leading-relaxed text-gray-700">
                  {tour.summary}
                </p>
              </div>
            )}

            {/* Description */}
            {tour.description && (
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  About this tour
                </h2>
                <div className="mt-2 space-y-3 text-base leading-relaxed text-gray-700">
                  {tour.description
                    .split("\n")
                    .map((para, i) =>
                      para.trim() ? <p key={i}>{para}</p> : null,
                    )}
                </div>
              </div>
            )}

            {/* Quick facts */}
            <div>
              <h2 className="text-xl font-bold text-gray-900">Quick facts</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <DetailItem
                  icon={ICONS.clock}
                  label="Duration"
                  value={`${tour.duration} ${tour.duration === 1 ? "day" : "days"}`}
                />
                <DetailItem
                  icon={ICONS.users}
                  label="Group size"
                  value={`Up to ${tour.maxGroupSize} guests`}
                />
                <DetailItem
                  icon={ICONS.pin}
                  label="Location"
                  value={
                    [city, country].filter(Boolean).join(", ") ||
                    tour.location?.address ||
                    "Not specified"
                  }
                />
                {tour.startDates?.length > 0 && (
                  <DetailItem
                    icon={ICONS.calendar}
                    label="Next departure"
                    value={new Date(tour.startDates[0]).toLocaleDateString(
                      undefined,
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      },
                    )}
                  />
                )}
              </div>
            </div>

            {/* Start dates */}
            {tour.startDates?.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Available dates
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {tour.startDates.map((d, i) => (
                    <span
                      key={i}
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800"
                    >
                      {new Date(d).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column — booking */}
          <div>
            <BookingCard tour={tour} />
          </div>
        </div>
      </section>
    </div>
  );
}

/* ---------- Page export ---------- */

export default function TourDetailPage() {
  return (
    <Suspense fallback={<TourDetailSkeleton />}>
      <TourDetailContent />
    </Suspense>
  );
}
