"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/* Types (add these fields to your shared User type when you can)      */
/* ------------------------------------------------------------------ */
type Labelled = string | { name?: string; title?: string; language?: string };
type TourRef =
  | string
  | { _id?: string; slug?: string; name?: string; title?: string };

type Availability = Partial<
  Record<
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday",
    boolean
  >
>;

type ExtendedUser = {
  _id?: string;
  name?: string;
  email?: string;
  photo?: string;
  role?: string;
  phone?: string;
  bio?: string;
  assignedTours?: TourRef[];
  guideSpecialties?: Labelled[];
  languages?: Labelled[];
  certifications?: Labelled[];
  availability?: Availability;
  rating?: number;
  totalReviews?: number;
  performanceMetrics?: {
    toursLed?: number;
    customerSatisfaction?: number;
    completionRate?: number;
    averageRating?: number;
  };
  createdAt?: string;
  updatedAt?: string;
};

/* ------------------------------------------------------------------ */
/* Constants & helpers                                                 */
/* ------------------------------------------------------------------ */
const QUICK_LINKS = [
  {
    href: "/me/reviews",
    icon: "⭐",
    title: "My reviews",
    body: "See and manage the reviews you've written.",
  },
  {
    href: "/me/settings",
    icon: "⚙️",
    title: "Settings",
    body: "Update your profile and change your password.",
  },
  {
    href: "/tours",
    icon: "🧭",
    title: "Browse tours",
    body: "Find your next adventure.",
  },
];

const DAYS = [
  { key: "monday", label: "Mon" },
  { key: "tuesday", label: "Tue" },
  { key: "wednesday", label: "Wed" },
  { key: "thursday", label: "Thu" },
  { key: "friday", label: "Fri" },
  { key: "saturday", label: "Sat" },
  { key: "sunday", label: "Sun" },
] as const;

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const PHOTO_PATH = "/img/users";

const labelOf = (item: Labelled): string =>
  typeof item === "string"
    ? item
    : (item.name ?? item.title ?? item.language ?? "");

const formatDate = (iso?: string, withTime = false) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
};

const pct = (n?: number) => (typeof n === "number" ? `${n}%` : "—");
const num = (n?: number) => (typeof n === "number" ? String(n) : "—");

/* ------------------------------------------------------------------ */
/* Small presentational pieces                                         */
/* ------------------------------------------------------------------ */
function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-gray-800">{children}</dd>
    </div>
  );
}

function Card({
  icon,
  title,
  children,
  className = "",
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-emerald-200 hover:shadow-md ${className}`}
    >
      <div className="flex items-center gap-3">
        <div
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg"
        >
          {icon}
        </div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
      {children}
    </span>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-500">{children}</p>;
}

function StatTile({
  icon,
  value,
  label,
}: {
  icon: string;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
      <span aria-hidden className="text-lg">
        {icon}
      </span>
      <div className="mt-1 text-2xl font-extrabold text-gray-900">{value}</div>
      <div className="text-xs font-medium text-gray-500">{label}</div>
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span
      className="text-amber-400"
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {"★".repeat(filled)}
      <span className="text-gray-300">{"★".repeat(5 - filled)}</span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function MePage() {
  const { user: rawUser, isLoading, isAdmin } = useAuth();
  const user = rawUser as unknown as ExtendedUser | null | undefined;
  const [copied, setCopied] = useState(false);

  const initial = (user?.name || user?.email || "?")
    .trim()
    .charAt(0)
    .toUpperCase();

  const photoUrl =
    user?.photo && user.photo !== "default.jpg"
      ? user.photo.startsWith("http")
        ? user.photo
        : `${API_URL}${PHOTO_PATH}/${user.photo}`
      : null;

  const specialties = (user?.guideSpecialties ?? [])
    .map(labelOf)
    .filter(Boolean);
  const languages = (user?.languages ?? []).map(labelOf).filter(Boolean);
  const certifications = (user?.certifications ?? [])
    .map(labelOf)
    .filter(Boolean);
  const assignedTours = user?.assignedTours ?? [];
  const metrics = user?.performanceMetrics;
  const rating = user?.rating ?? 0;
  const totalReviews = user?.totalReviews ?? 0;

  const hasGuideData =
    !!user &&
    (/guide/i.test(user.role ?? "") ||
      specialties.length > 0 ||
      languages.length > 0 ||
      certifications.length > 0 ||
      assignedTours.length > 0 ||
      rating > 0 ||
      totalReviews > 0 ||
      (metrics?.toursLed ?? 0) > 0);

  const copyId = async () => {
    if (!user?._id) return;
    try {
      await navigator.clipboard.writeText(user._id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white">
        {/* ============================ HERO ============================ */}
        <section className="relative overflow-hidden bg-linear-to-br from-emerald-50 via-white to-sky-50">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-emerald-200/40 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl"
          />

          <div className="relative mx-auto max-w-5xl px-6 py-12 sm:py-16">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-3 py-1 text-xs font-medium text-emerald-800 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Your account
            </span>

            {isLoading || !user ? (
              <div className="mt-6 flex items-center gap-5" aria-busy="true">
                <div className="h-20 w-20 animate-pulse rounded-full bg-gray-200" />
                <div className="space-y-3">
                  <div className="h-7 w-48 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-64 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            ) : (
              <div className="mt-6 flex flex-wrap items-center gap-5">
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoUrl}
                    alt={user.name ?? "Profile photo"}
                    className="h-20 w-20 shrink-0 rounded-full border-2 border-white object-cover shadow-md"
                  />
                ) : (
                  <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-emerald-500 to-sky-500 text-3xl font-bold text-white shadow-md">
                    {initial}
                  </span>
                )}
                <div className="min-w-0">
                  <h1 className="truncate text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                    Welcome back,{" "}
                    <span className="bg-linear-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent">
                      {user.name?.split(" ")[0] || "traveler"}
                    </span>
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold capitalize text-emerald-800">
                      {user.role || "user"}
                    </span>
                    {rating > 0 && (
                      <span className="inline-flex items-center gap-1.5">
                        <Stars rating={rating} />
                        <span className="font-semibold text-gray-800">
                          {rating.toFixed(1)}
                        </span>
                        <span className="text-gray-500">
                          ({totalReviews}{" "}
                          {totalReviews === 1 ? "review" : "reviews"})
                        </span>
                      </span>
                    )}
                    <span>Manage your profile, reviews, and preferences</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ============================ CONTENT ============================ */}
        <div className="mx-auto max-w-5xl px-6 py-12">
          {isLoading || !user ? (
            <div className="grid gap-6 md:grid-cols-3" aria-busy="true">
              <div className="h-56 animate-pulse rounded-2xl border border-gray-200 bg-white shadow-sm md:col-span-2" />
              <div className="h-56 animate-pulse rounded-2xl border border-gray-200 bg-white shadow-sm" />
            </div>
          ) : (
            <>
              {/* ---------- Profile + Account ---------- */}
              <div className="grid gap-6 md:grid-cols-3">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-emerald-200 hover:shadow-md md:col-span-2">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Profile
                    </h2>
                    <Link
                      href="/me/settings"
                      className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      Edit →
                    </Link>
                  </div>

                  <dl className="mt-5 grid gap-5 sm:grid-cols-2">
                    <Field label="Name">{user.name || "—"}</Field>
                    <Field label="Email">
                      <span className="break-all">{user.email || "—"}</span>
                    </Field>
                    <Field label="Role">
                      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold capitalize text-emerald-800">
                        {user.role || "—"}
                      </span>
                    </Field>
                    <Field label="Member since">
                      {formatDate(user.createdAt)}
                    </Field>
                    <Field label="Last updated">
                      {formatDate(user.updatedAt, true)}
                    </Field>
                    {user.phone && <Field label="Phone">{user.phone}</Field>}
                    {user.bio && (
                      <Field label="Bio" className="sm:col-span-2">
                        <span className="text-pretty">{user.bio}</span>
                      </Field>
                    )}
                  </dl>
                </div>

                <aside className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Account
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                      {isAdmin
                        ? "You have administrator access."
                        : "Your account is in good standing."}
                    </p>

                    {user._id && (
                      <div className="mt-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                          Account ID
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <code className="min-w-0 flex-1 truncate rounded-lg bg-gray-50 px-2 py-1 text-xs text-gray-700">
                            {user._id}
                          </code>
                          <button
                            type="button"
                            onClick={copyId}
                            className="shrink-0 rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                          >
                            {copied ? "Copied ✓" : "Copy"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {isAdmin ? (
                    <Link
                      href="/admin"
                      className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 hover:shadow-emerald-700/30"
                    >
                      🛡️ Admin panel
                    </Link>
                  ) : (
                    <Link
                      href="/tours"
                      className="mt-6 inline-flex items-center justify-center rounded-xl border border-emerald-600 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                    >
                      Browse tours
                    </Link>
                  )}
                </aside>
              </div>

              {/* ---------- Guide / performance sections ---------- */}
              {hasGuideData && (
                <>
                  <h2 className="mt-12 text-xl font-bold text-gray-900">
                    Performance
                  </h2>
                  <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                    <StatTile
                      icon="⭐"
                      value={
                        rating > 0
                          ? rating.toFixed(1)
                          : num(metrics?.averageRating)
                      }
                      label="Average rating"
                    />
                    <StatTile
                      icon="💬"
                      value={String(totalReviews)}
                      label="Total reviews"
                    />
                    <StatTile
                      icon="🧭"
                      value={num(metrics?.toursLed)}
                      label="Tours led"
                    />
                    <StatTile
                      icon="✅"
                      value={pct(metrics?.completionRate)}
                      label="Completion rate"
                    />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                    <StatTile
                      icon="😊"
                      value={pct(metrics?.customerSatisfaction)}
                      label="Customer satisfaction"
                    />
                  </div>

                  <div className="mt-8 grid gap-6 md:grid-cols-3">
                    <Card icon="🎯" title="Specialties">
                      {specialties.length ? (
                        <div className="flex flex-wrap gap-2">
                          {specialties.map((s) => (
                            <Chip key={s}>{s}</Chip>
                          ))}
                        </div>
                      ) : (
                        <EmptyHint>No specialties added yet.</EmptyHint>
                      )}
                    </Card>

                    <Card icon="🗣️" title="Languages">
                      {languages.length ? (
                        <div className="flex flex-wrap gap-2">
                          {languages.map((l) => (
                            <Chip key={l}>{l}</Chip>
                          ))}
                        </div>
                      ) : (
                        <EmptyHint>No languages added yet.</EmptyHint>
                      )}
                    </Card>

                    <Card icon="🏅" title="Certifications">
                      {certifications.length ? (
                        <ul className="space-y-2 text-sm text-gray-800">
                          {certifications.map((c) => (
                            <li key={c} className="flex items-start gap-2">
                              <span aria-hidden className="text-emerald-600">
                                ✓
                              </span>
                              {c}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <EmptyHint>No certifications added yet.</EmptyHint>
                      )}
                    </Card>
                  </div>

                  <div className="mt-6 grid gap-6 md:grid-cols-2">
                    <Card icon="📅" title="Weekly availability">
                      <ul className="grid grid-cols-7 gap-2">
                        {DAYS.map(({ key, label }) => {
                          const on = !!user.availability?.[key];
                          return (
                            <li
                              key={key}
                              className={`rounded-xl border px-1 py-2 text-center text-xs font-semibold ${
                                on
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                  : "border-gray-200 bg-gray-50 text-gray-400"
                              }`}
                            >
                              <span className="block">{label}</span>
                              <span aria-hidden className="block">
                                {on ? "✓" : "–"}
                              </span>
                              <span className="sr-only">
                                {on ? "available" : "unavailable"}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </Card>

                    <Card icon="🗺️" title="Assigned tours">
                      {assignedTours.length ? (
                        <ul className="space-y-2 text-sm">
                          {assignedTours.map((t, i) => {
                            const isObj = typeof t !== "string";
                            const id = isObj ? (t._id ?? t.slug) : t;
                            const slug = isObj ? (t.slug ?? t._id) : t;
                            const name = isObj
                              ? (t.name ?? t.title ?? `Tour ${i + 1}`)
                              : `Tour ${i + 1}`;
                            return (
                              <li key={id ?? i}>
                                <Link
                                  href={`/tours/${slug}`}
                                  className="block rounded-lg px-3 py-2 text-gray-700 transition hover:bg-emerald-50 hover:text-emerald-800"
                                >
                                  🧭 {name}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <EmptyHint>No tours assigned yet.</EmptyHint>
                      )}
                    </Card>
                  </div>
                </>
              )}

              {/* ---------- Quick links ---------- */}
              <h2 className="mt-12 text-xl font-bold text-gray-900">
                Quick links
              </h2>
              <div className="mt-4 grid gap-6 md:grid-cols-3">
                {QUICK_LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
                  >
                    <div
                      aria-hidden
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-xl"
                    >
                      {l.icon}
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-gray-900 group-hover:text-emerald-800">
                      {l.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">{l.body}</p>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
