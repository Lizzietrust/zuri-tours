"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { tourService, type NearbyTourParams } from "@/services/tours";
import type { TourQueryParams } from "@/types";

function stableKey(params: TourQueryParams): string {
  return JSON.stringify(
    Object.keys(params)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        const v = (params as Record<string, unknown>)[k];
        if (v !== undefined && v !== null && v !== "") acc[k] = v;
        return acc;
      }, {}),
  );
}

export function useTours(
  params: TourQueryParams,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ["tours", stableKey(params)],
    queryFn: () => tourService.getAll(params),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
  });
}

/**
 * Tours near a point, filtered / sorted / paginated by the backend.
 * Pass `null` until the user's location is known — the query stays idle.
 */
export function useNearbyTours(params: NearbyTourParams | null) {
  return useQuery({
    queryKey: ["tours", "nearby", params],
    queryFn: () => tourService.getNearby(params as NearbyTourParams),
    enabled: params !== null,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}

export function useTour(slug: string) {
  return useQuery({
    queryKey: ["tour", slug],
    queryFn: () => tourService.getBySlug(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  });
}

export function useFeaturedTours(limit = 3) {
  return useQuery({
    queryKey: ["tours", "featured", limit],
    queryFn: () => tourService.getFeatured(limit),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}
