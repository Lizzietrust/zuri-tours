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

function stableNearbyKey(params: Omit<NearbyTourParams, "lat" | "lng">) {
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

/**
 * Tours near a *place name*. Geocodes the place on the server, then runs
 * the geo pipeline. Disabled until the caller passes a real query.
 *
 * `radius` is optional — the service defaults to 100 km when omitted.
 */
export function useToursByLocation(
  query: string,
  params: Omit<NearbyTourParams, "lat" | "lng"> = {},
) {
  const trimmed = query.trim();
  const enabled = trimmed.length >= 2;

  return useQuery({
    queryKey: ["tours", "byLocation", trimmed, stableNearbyKey(params)],
    queryFn: () => tourService.getByLocation(trimmed, params),
    enabled,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    retry: 1,
  });
}
