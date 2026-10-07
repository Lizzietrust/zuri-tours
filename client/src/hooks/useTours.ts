"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { tourService } from "@/services/tours";
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

export function useTours(params: TourQueryParams) {
  return useQuery({
    queryKey: ["tours", stableKey(params)],
    queryFn: () => tourService.getAll(params),
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
  });
}
