"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { tourService } from "@/services/tours";
import type { TourQueryParams } from "@/types";

export function useTours(params: TourQueryParams = {}) {
  return useQuery({
    queryKey: ["tours", params],
    queryFn: () => tourService.getAll(params),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
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
