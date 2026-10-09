"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import Logo from "./Logo";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function Header() {
  const { user, isAuthenticated, isAdmin, isGuide, logout, isLoading } =
    useAuth();
  const pathname = usePathname();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const linkClass = (href: string) => {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return `transition hover:text-emerald-700 ${
      active ? "font-semibold text-emerald-700" : "text-gray-700"
    }`;
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      toast.success("Logged out successfully", {
        description: "See you again soon!",
      });
    } catch (err) {
      const message =
        (err as { message?: string })?.message ?? "Something went wrong";
      toast.error("Logout failed", {
        description: `${message}. Your session on this device has been cleared.`,
      });
    } finally {
      setLoggingOut(false);
      setConfirmOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
        <Logo size={36} />

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
                onClick={() => setConfirmOpen(true)}
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

      <ConfirmDialog
        open={confirmOpen}
        variant="danger"
        title="Log out of Zuri Tours?"
        description="You'll need to sign in again to book tours or view your account."
        confirmLabel="Yes, log out"
        cancelLabel="Stay signed in"
        isLoading={loggingOut}
        onConfirm={handleLogout}
        onCancel={() => setConfirmOpen(false)}
      />
    </header>
  );
}
