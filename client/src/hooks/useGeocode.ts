"use client";

import { useQuery } from "@tanstack/react-query";
import { geocodeService } from "@/services/geocode";

export function useGeocode(query: string) {
  const trimmed = query.trim();

  return useQuery({
    queryKey: ["geocode", trimmed],
    queryFn: () => geocodeService.search(trimmed),
    enabled: trimmed.length >= 2,
    staleTime: 1000 * 60 * 60 * 24,
    retry: 0,
  });
}
