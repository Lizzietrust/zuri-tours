"use client";

import dynamic from "next/dynamic";

export const TourMapDynamic = dynamic(() => import("./TourMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-140 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50">
      <p className="text-sm text-gray-500">Loading map…</p>
    </div>
  ),
});
