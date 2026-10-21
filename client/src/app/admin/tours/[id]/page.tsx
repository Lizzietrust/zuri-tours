"use client";

import { Suspense, useCallback, useId, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useTour } from "@/hooks/useTours";
import { imageUrl } from "@/services/tours";
import { formatDate } from "@/lib/utils";
import { formatDistance } from "@/lib/geo";
import BookingCard from "@/components/tours/BookingCard";
import type { Tour } from "@/types";

/* ---------- Constants ---------- */

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

/* ---------- Star rating (deterministic — no Math.random) ---------- */

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
  const uid = useId();

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
          const gradientId = `${uid}-star-${i}`;

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
    () => (images.length > 0 ? images : [null]),
    [images],
  );

  return (
    <div className="space-y-3">
      <div className="relative aspect-16/10 w-full overflow-hidden rounded-2xl bg-gray-100">
        {!imgError && displayImages[active] ? (
          <Image
            src={imageUrl(displayImages[active] ?? undefined)}
            alt={`${name} - image ${active + 1}`}
            fill
            sizes="(max-width: 1024px) 100vw, 800px"
            className="object-cover"
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
              {img && (
                <Image
                  src={imageUrl(img)}
                  alt=""
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
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

/* ---------- Loading & error states ---------- */

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
        </div>
        <div className="h-96 rounded-2xl bg-gray-200" />
      </div>
    </div>
  );
}

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

  const { data, isLoading, isError, error, refetch } = useTour(slug);

  const tour: Tour | undefined = useMemo(() => {
    if (!data) return undefined;

    const anyData = data as unknown as {
      data?: { tour?: Tour } | Tour;
      tour?: Tour;
    };

    if (
      anyData.data &&
      typeof anyData.data === "object" &&
      "tour" in anyData.data
    ) {
      return (anyData.data as { tour?: Tour }).tour;
    }

    if (anyData.data && typeof anyData.data === "object") {
      return anyData.data as Tour;
    }

    if (anyData.tour) return anyData.tour;

    return data as unknown as Tour;
  }, [data]);

  const handleBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/tours");
    }
  }, [router]);

  if (isLoading) return <TourDetailSkeleton />;

  if (isError) {
    return (
      <TourError
        message={(error as Error)?.message ?? "Failed to load tour."}
        onRetry={() => refetch()}
      />
    );
  }

  if (!tour) {
    return (
      <TourError message="This tour doesn't exist." onRetry={() => refetch()} />
    );
  }

  const city = tour.location?.city;
  const country = tour.location?.country;
  const hasDistance =
    typeof tour.distance === "number" && Number.isFinite(tour.distance);

  const galleryImages = [tour.imageCover, ...(tour.images ?? [])].filter(
    Boolean,
  ) as string[];

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
            <ImageGallery images={galleryImages} name={tour.name} />

            {tour.summary && (
              <div>
                <h2 className="text-xl font-bold text-gray-900">Overview</h2>
                <p className="mt-2 text-base leading-relaxed text-gray-700">
                  {tour.summary}
                </p>
              </div>
            )}

            {tour.description && (
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  About this tour
                </h2>
                <div className="mt-2 space-y-3 text-base leading-relaxed text-gray-700">
                  {tour.description
                    .split("\n")
                    .map((para: string, i: number) =>
                      para.trim() ? <p key={i}>{para}</p> : null,
                    )}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-xl font-bold text-gray-900">Quick facts</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <DetailItem
                  icon={ICONS.clock}
                  label="Duration"
                  value={`${tour.duration} ${
                    tour.duration === 1 ? "day" : "days"
                  }`}
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
                    value={formatDate(tour.startDates[0])}
                  />
                )}
              </div>
            </div>

            {tour.startDates?.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Available dates
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {tour.startDates.map((d: string | Date, i: number) => (
                    <span
                      key={i}
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800"
                    >
                      {formatDate(d)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column — shared BookingCard */}
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
