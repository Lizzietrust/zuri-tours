"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function GuideRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAuthenticated, isGuide } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login?redirect=/guide");
      return;
    }
    if (!isGuide) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, isGuide, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated || !isGuide) return null;

  return <>{children}</>;
}
