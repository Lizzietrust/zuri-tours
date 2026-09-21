"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function Header() {
  const { user, isAuthenticated, isAdmin, isGuide, logout, isLoading } =
    useAuth();
  const pathname = usePathname();

  const linkClass = (href: string) =>
    `transition hover:text-emerald-700 ${
      pathname === href ? "font-semibold text-emerald-700" : "text-gray-700"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold text-emerald-700"
        >
          <span className="text-2xl">🏔️</span>
          <span>Zuri Tours</span>
        </Link>

        {/* Main links */}
        <ul className="hidden items-center gap-6 text-sm md:flex">
          <li>
            <Link href="/tours" className={linkClass("/tours")}>
              All Tours
            </Link>
          </li>

          {isGuide && (
            <li>
              <Link href="/guide" className={linkClass("/guide")}>
                My Assignments
              </Link>
            </li>
          )}

          {isAdmin && (
            <li>
              <Link href="/admin" className={linkClass("/admin")}>
                Admin
              </Link>
            </li>
          )}
        </ul>

        {/* Auth controls */}
        <div className="flex items-center gap-2">
          {isLoading ? (
            <div className="h-9 w-24 animate-pulse rounded bg-gray-100" />
          ) : isAuthenticated ? (
            <>
              <Link
                href="/me"
                className="hidden rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 sm:inline-block"
              >
                Hi, {user!.name.split(" ")[0]}
              </Link>
              <button
                type="button"
                onClick={logout}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
