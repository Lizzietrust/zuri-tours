"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

/** Pages under /me that admins may still use. */
const ADMIN_ALLOWED = ["/me/settings"];

export default function MeLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading, isAdmin } = useAuth();

  const adminBlocked =
    isAdmin &&
    !ADMIN_ALLOWED.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  useEffect(() => {
    if (!isLoading && adminBlocked) router.replace("/admin");
  }, [isLoading, adminBlocked, router]);

  if (isLoading || adminBlocked) {
    return (
      <div
        role="status"
        aria-busy="true"
        className="flex min-h-[60vh] items-center justify-center"
      >
        <span
          aria-hidden
          className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600"
        />
        <span className="sr-only">Loading…</span>
      </div>
    );
  }

  return <>{children}</>;
}
