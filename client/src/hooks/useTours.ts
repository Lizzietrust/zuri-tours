// src/hooks/useTours.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { tourService } from "@/services/tours";
import type { Tour } from "@/types";

export function useTours() {
  return useQuery({
    queryKey: ["tours"],
    queryFn: () => tourService.getAll(),
    placeholderData: (previous) => previous,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useTour(slug: string, initialData?: Tour) {
  return useQuery({
    queryKey: ["tour", slug],
    queryFn: () => tourService.getBySlug(slug),
    enabled: !!slug,
    initialData: initialData
      ? ({ status: "success", data: { tour: initialData } } as const)
      : undefined,
    staleTime: 1000 * 60 * 5,
  });
}
