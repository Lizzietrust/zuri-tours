"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminService } from "@/services/admin";

const STATUSES = ["all", "pending", "approved", "rejected"] as const;

export default function AdminReviewsPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("pending");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "reviews", { status, page }],
    queryFn: () =>
      adminService.getAllReviews({
        status: status === "all" ? undefined : status,
        page,
        limit: 10,
      }),
  });

  const approve = useMutation({
    mutationFn: (id: string) => adminService.approveReview(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "reviews"] }),
  });

  const reject = useMutation({
    mutationFn: (id: string) => adminService.rejectReview(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "reviews"] }),
  });

  const del = useMutation({
    mutationFn: (id: string) => adminService.deleteReview(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "reviews"] }),
  });

  const reviews = data?.data ?? [];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Reviews</h1>
      <p className="mt-1 text-sm text-gray-500">
        Moderate user-submitted reviews.
      </p>

      <div className="mt-6 flex gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize ${
              status === s
                ? "bg-emerald-600 text-white"
                : "border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="mt-6 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg bg-gray-100"
            />
          ))}
        </div>
      )}

      {!isLoading && (
        <div className="mt-6 space-y-3">
          {reviews.map((r) => (
            <article
              key={r._id}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-gray-900">
                      {r.rating}★
                    </span>
                    <span className="text-sm text-gray-500">
                      {typeof r.user === "object" && r.user
                        ? (r.user as { name: string }).name
                        : "User"}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs capitalize ${
                        r.status === "approved"
                          ? "bg-emerald-100 text-emerald-800"
                          : r.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-700">{r.review}</p>
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  {r.status !== "approved" && (
                    <button
                      onClick={() => approve.mutate(r._id)}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      Approve
                    </button>
                  )}
                  {r.status !== "rejected" && (
                    <button
                      onClick={() => reject.mutate(r._id)}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Reject
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm("Delete this review?")) del.mutate(r._id);
                    }}
                    className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}

          {reviews.length === 0 && (
            <p className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500">
              No reviews found for this filter.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
