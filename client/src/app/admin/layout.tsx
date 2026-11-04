"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AdminShell from "@/components/admin/AdminShell";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isLoading, isAdmin } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.replace("/login?redirect=/admin");
    else if (!isAdmin) router.replace("/me");
  }, [isLoading, user, isAdmin, router]);

  if (isLoading || !user || !isAdmin) {
    return (
      <div className="p-12 text-center text-sm text-gray-500" aria-busy="true">
        Checking access…
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
