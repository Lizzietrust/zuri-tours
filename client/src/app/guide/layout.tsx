"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import GuideShell from "@/components/guide/GuideShell";

export default function GuideLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const role = user?.role;
  const allowed = role === "guide" || role === "lead-guide";

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.replace("/login?redirect=/guide");
    else if (role === "admin") router.replace("/admin");
    else if (!allowed) router.replace("/me");
  }, [isLoading, user, role, allowed, router]);

  if (isLoading || !allowed) {
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
        <span className="sr-only">Checking access…</span>
      </div>
    );
  }

  return <GuideShell isLead={role === "lead-guide"}>{children}</GuideShell>;
}
