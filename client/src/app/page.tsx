"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFeaturedTours } from "@/hooks/useTours";
import TourCard from "@/components/tours/TourCard";
import TourCardSkeleton from "@/components/tours/TourCardSkeleton";

const FEATURED_COUNT = 3;

const STATS = [
  { value: "4.8", label: "Average rating", icon: "⭐" },
  { value: "40+", label: "Destinations", icon: "🌍" },
  { value: "10k+", label: "Happy travelers", icon: "😊" },
  { value: "24/7", label: "Support", icon: "💬" },
];

const FEATURES = [
  {
    icon: "🎯",
    title: "Curated experiences",
    body: "Every tour is hand-picked and vetted by our team of travel experts.",
  },
  {
    icon: "🧑‍🏫",
    title: "Expert local guides",
    body: "Learn from guides who call each destination home.",
  },
  {
    icon: "🛡️",
    title: "Book with confidence",
    body: "Flexible cancellation and 24/7 support on every trip.",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Discover",
    body: "Search and filter tours by difficulty, price, and rating.",
  },
  {
    n: "2",
    title: "Book",
    body: "Pick your dates and reserve your spot in a few clicks.",
  },
  {
    n: "3",
    title: "Explore",
    body: "Meet your guide and enjoy a trip you'll never forget.",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const {
    data: featured,
    isLoading,
    isError,
    refetch,
  } = useFeaturedTours(FEATURED_COUNT);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/tours?q=${encodeURIComponent(q)}` : "/tours");
  };

  const hasTours = !isLoading && !isError && !!featured && featured.length > 0;
  const isEmpty =
    !isLoading && !isError && (!featured || featured.length === 0);

  return (
    <div className="min-h-screen">
      {/* ============================ HERO ============================ */}
      <section className="relative overflow-hidden bg-linear-to-br from-emerald-50 via-white to-sky-50">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-emerald-200/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-sky-200/40 blur-3xl"
        />

        <div className="relative mx-auto max-w-5xl px-6 py-20 text-center sm:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-3 py-1 text-xs font-medium text-emerald-800 backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 motion-safe:animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            New tours added weekly
          </span>

          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-balance text-gray-900 sm:text-6xl">
            Explore the world with{" "}
            <span className="bg-linear-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent">
              Zuri Tours
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-pretty text-gray-600">
            Handcrafted tours, expert guides, and unforgettable memories —
            curated for the way you love to travel.
          </p>

          {/* Search */}
          <form
            onSubmit={onSearch}
            role="search"
            className="mx-auto mt-10 flex max-w-xl items-center gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-lg shadow-emerald-900/5 focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100"
          >
            <label htmlFor="hero-search" className="sr-only">
              Search tours
            </label>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              className="ml-2 h-5 w-5 shrink-0 text-gray-400"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              id="hero-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search destinations or tours…"
              className="min-w-0 flex-1 bg-transparent px-1 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            >
              Search
            </button>
          </form>

          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              href="/tours"
              className="rounded-xl bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 hover:shadow-emerald-700/30"
            >
              Browse Tours
            </Link>
            <Link
              href="/signup"
              className="rounded-xl border border-emerald-600 bg-white px-6 py-3 text-base font-semibold text-emerald-700 transition hover:bg-emerald-50"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* ============================ STATS ============================ */}
      <section
        aria-label="Highlights"
        className="border-y border-gray-100 bg-white"
      >
        <dl className="mx-auto grid max-w-5xl grid-cols-2 gap-y-6 px-6 py-8 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <dt className="sr-only">{s.label}</dt>
              <dd>
                <span aria-hidden className="text-lg">
                  {s.icon}
                </span>
                <div className="text-2xl font-extrabold text-gray-900">
                  {s.value}
                </div>
                <div className="text-xs font-medium text-gray-500" aria-hidden>
                  {s.label}
                </div>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ======================= FEATURED TOURS ======================= */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Featured tours
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              The highest-rated adventures our travelers love
            </p>
          </div>
          <Link
            href="/tours"
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            View all tours →
          </Link>
        </div>

        {isLoading && (
          <div
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            aria-busy="true"
          >
            {Array.from({ length: FEATURED_COUNT }).map((_, i) => (
              <TourCardSkeleton key={i} />
            ))}
          </div>
        )}

        {isError && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800"
          >
            <span>We couldn&apos;t load featured tours right now.</span>
            <span className="flex gap-3">
              <button
                type="button"
                onClick={() => refetch()}
                className="rounded-lg bg-amber-600 px-3 py-1.5 font-semibold text-white hover:bg-amber-700"
              >
                Try again
              </button>
              <Link
                href="/tours"
                className="py-1.5 font-semibold underline hover:no-underline"
              >
                Browse all tours
              </Link>
            </span>
          </div>
        )}

        {hasTours && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured!.map((tour) => (
              <TourCard key={tour._id} tour={tour} />
            ))}
          </div>
        )}

        {isEmpty && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
            <span className="text-4xl" aria-hidden>
              🧭
            </span>
            <p className="mt-3 text-sm text-gray-600">
              No tours published yet. Check back soon!
            </p>
            <Link
              href="/tours"
              className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Browse tours
            </Link>
          </div>
        )}
      </section>

      {/* ========================= WHY ZURI ========================== */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Why travel with Zuri?
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-600">
              We obsess over the details so you can focus on the journey.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
              >
                <div
                  aria-hidden
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-xl"
                >
                  {f.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  {f.title}
                </h3>
                <p className="mt-1 text-sm text-gray-600">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================= HOW IT WORKS ======================== */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
          How it works
        </h2>
        <ol className="mt-10 grid gap-8 md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-emerald-500 to-sky-500 text-lg font-bold text-white shadow-md">
                {s.n}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                {s.title}
              </h3>
              <p className="mt-1 text-sm text-gray-600">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ============================ CTA ============================ */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-emerald-600 to-sky-600 px-8 py-12 text-center shadow-xl sm:px-16 sm:py-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, white 0%, transparent 40%), radial-gradient(circle at 80% 80%, white 0%, transparent 40%)",
            }}
          />
          <div className="relative">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Ready for your next adventure?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-emerald-50">
              Sign up free and start planning your trip today.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/register"
                className="rounded-xl bg-white px-6 py-3 text-base font-semibold text-emerald-700 shadow-lg transition hover:bg-emerald-50"
              >
                Create free account
              </Link>
              <Link
                href="/tours"
                className="rounded-xl border border-white/70 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10"
              >
                Browse tours
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
