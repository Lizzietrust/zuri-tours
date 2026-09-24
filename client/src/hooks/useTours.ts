"use client";

import { useQuery } from "@tanstack/react-query";
import { tourService } from "@/services/tours";

export function useTours() {
  return useQuery({
    queryKey: ["tours"],
    queryFn: () => tourService.getAll(),
    placeholderData: (previous) => previous,
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
