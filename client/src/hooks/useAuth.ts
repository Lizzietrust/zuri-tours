"use client";

import { useSyncExternalStore } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth";
import { getToken } from "@/lib/api";
import type { User } from "@/types";

const subscribe = () => () => {};

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const hasToken = mounted && !!getToken();

  const {
    data: user,
    isLoading: isQueryLoading,
    isError,
    refetch,
  } = useQuery<User | null>({
    queryKey: ["me"],
    queryFn: async () => {
      if (!getToken()) return null;
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

  /**
   * Always clears local state and redirects, even if the server call fails
   * (authService.logout clears the token in `finally`). The error is then
   * re-thrown so the caller can show an error toast.
   */
  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      queryClient.setQueryData(["me"], null);
      queryClient.removeQueries({ queryKey: ["tours"] });
      router.push("/");
      router.refresh();
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === "admin";
  const isGuide = user?.role === "guide" || user?.role === "lead-guide";
  const isLeadGuide = user?.role === "lead-guide";

  return {
    user: user ?? null,
    isLoading: !mounted || isQueryLoading,
    isError,
    isAuthenticated,
    isAdmin,
    isGuide,
    isLeadGuide,
    logout,
    refetch,
  };
}
