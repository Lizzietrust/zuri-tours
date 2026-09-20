"use client";

import { useQuery } from "@tanstack/react-query";
import { tourService } from "@/services/tours";
import TourCard from "@/components/tours/TourCard";
import type { Tour } from "@/types";

export default function ToursPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["tours"],
    queryFn: () => tourService.getAll(),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12">
        <p className="text-gray-500">Loading tours…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12">
        <p className="text-red-600">
          Failed to load tours: {(error as { message: string }).message}
        </p>
      </div>
    );
  }

  const tours = (data?.data?.tours || []) as Tour[];

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="mb-8 text-3xl font-bold">All Tours</h1>

      {tours.length === 0 ? (
        <p className="text-gray-500">No tours available.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tours.map((tour) => (
            <TourCard key={tour._id} tour={tour} />
          ))}
        </div>
      )}
    </div>
  );
}
