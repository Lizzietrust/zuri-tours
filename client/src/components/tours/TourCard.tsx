import Link from "next/link";
import type { Tour } from "@/types";
import { formatCurrency } from "@/lib/utils";

export default function TourCard({ tour }: { tour: Tour }) {
  return (
    <Link
      href={`/tours/${tour.slug}`}
      className="group overflow-hidden rounded-lg border bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="relative h-48 w-full overflow-hidden bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`http://localhost:8000/img/tours/${tour.imageCover}`}
          alt={tour.name}
          className="h-full w-full object-cover transition group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold">{tour.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-gray-600">
          {tour.summary}
        </p>

        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-gray-500">{tour.duration} days</span>
          <span className="font-semibold text-emerald-700">
            {formatCurrency(tour.price)}
          </span>
        </div>

        {tour.hasUserReviewed && (
          <span className="mt-3 inline-block rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-800">
            You reviewed this
          </span>
        )}
      </div>
    </Link>
  );
}
