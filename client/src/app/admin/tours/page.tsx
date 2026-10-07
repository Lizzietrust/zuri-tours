"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { adminService } from "@/services/admin";

export default function AdminToursPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "tours", { page }],
    queryFn: () => adminService.getAllTours({ page, limit: 10 }),
  });

  const deleteTour = useMutation({
    mutationFn: (id: string) => adminService.deleteTour(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "tours"] }),
  });

  const tours = data?.data ?? [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tours</h1>
          <p className="mt-1 text-sm text-gray-500">
            {data?.total ?? 0} total tours
          </p>
        </div>
        <Link
          href="/admin/tours/new"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          + New tour
        </Link>
      </div>

      {isLoading && (
        <div className="mt-6 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-gray-100"
            />
          ))}
        </div>
      )}

      {!isLoading && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Price
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Duration
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Difficulty
                </th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tours.map((t) => (
                <tr key={t._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {t.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">${t.price}</td>
                  <td className="px-4 py-3 text-gray-600">{t.duration} days</td>
                  <td className="px-4 py-3 capitalize text-gray-600">
                    {t.difficulty}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/tours/${t._id}`}
                      className="mr-3 text-sm font-medium text-emerald-700 hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => {
                        if (confirm(`Delete tour "${t.name}"?`)) {
                          deleteTour.mutate(t._id);
                        }
                      }}
                      className="text-sm font-medium text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {tours.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-gray-500"
                  >
                    No tours found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {data && data.pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-gray-300 px-3 py-1.5 font-medium text-gray-700 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-gray-500">
            Page {page} of {data.pages}
          </span>
          <button
            disabled={page >= data.pages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 font-medium text-gray-700 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
