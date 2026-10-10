"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { guideService } from "@/services/guides";
import { toast } from "sonner";
import type { Guide } from "@/types";

/* ---------- Profile ---------- */

export function useGuideProfile() {
  return useQuery({
    queryKey: ["guide", "me"],
    queryFn: guideService.getMe,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateGuideProfile() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<Guide>) => guideService.updateMe(payload),
    onSuccess: (updated) => {
      qc.setQueryData(["guide", "me"], updated);
      qc.invalidateQueries({ queryKey: ["me"] });
      toast.success("Profile updated");
    },
    onError: (err: unknown) => {
      const message =
        (err as { message?: string })?.message ?? "Failed to update profile";
      toast.error(message);
    },
  });
}

/* ---------- Stats ---------- */

export function useGuideStatistics() {
  return useQuery({
    queryKey: ["guide", "statistics"],
    queryFn: guideService.getStatistics,
    staleTime: 60 * 1000,
  });
}

export function useGuidePerformance() {
  return useQuery({
    queryKey: ["guide", "performance"],
    queryFn: guideService.getPerformance,
    staleTime: 60 * 1000,
  });
}

/* ---------- Assigned tours ---------- */

export function useAssignedTours() {
  return useQuery({
    queryKey: ["guide", "assigned-tours"],
    queryFn: () =>
      guideService.getAssignedTours({
        populateGuides: true,
        populateGuideDetails: true,
        populateReviews: true,
      }),
    staleTime: 60 * 1000,
  });
}
