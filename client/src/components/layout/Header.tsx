"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b bg-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold text-emerald-700">
          Zuri Tours
        </Link>

        <ul className="flex items-center gap-6 text-sm">
          <li>
            <Link href="/tours" className="hover:text-emerald-700">
              All Tours
            </Link>
          </li>
          <li>
            <Link href="/login" className="hover:text-emerald-700">
              Log in
            </Link>
          </li>
          <li>
            <Link
              href="/signup"
              className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
            >
              Sign up
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
