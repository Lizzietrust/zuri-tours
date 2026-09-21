"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth";
import { getToken } from "@/lib/api";
import type { User } from "@/types";

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const hasToken = typeof window !== "undefined" && !!getToken();

  const {
    data: user,
    isLoading,
    isError,
    refetch,
  } = useQuery<User | null>({
    queryKey: ["me"],
    queryFn: async () => {
      if (!hasToken) return null;
      try {
        return await authService.getMe();
      } catch {
        return null;
      }
    },
    enabled: hasToken,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const logout = async () => {
    await authService.logout();
    queryClient.setQueryData(["me"], null);
    queryClient.removeQueries({ queryKey: ["tours"] });
    router.push("/");
    router.refresh();
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === "admin";
  const isGuide = user?.role === "guide" || user?.role === "lead-guide";
  const isLeadGuide = user?.role === "lead-guide";

  return {
    user: user ?? null,
    isLoading,
    isError,
    isAuthenticated,
    isAdmin,
    isGuide,
    isLeadGuide,
    logout,
    refetch,
  };
}
