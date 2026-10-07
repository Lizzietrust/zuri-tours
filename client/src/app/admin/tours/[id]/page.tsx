"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminService } from "@/services/admin";
import type { Tour } from "@/types";

type Difficulty = Tour["difficulty"];

export default function EditTourPage({ params }: { params: { id: string } }) {
  const { id } = params;

  const {
    data: tour,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin", "tour", id],
    queryFn: async () => {
      const { api } = await import("@/lib/api");
      const { data } = await api.get(`/tours/${id}`);
      return data.data as Tour;
    },
  });

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />;
  }

  if (isError || !tour) {
    return <p className="text-sm text-red-600">Failed to load tour.</p>;
  }

  return <EditTourForm key={tour._id} tour={tour} />;
}

function EditTourForm({ tour }: { tour: Tour }) {
  const router = useRouter();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    name: tour.name ?? "",
    summary: tour.summary ?? "",
    description: tour.description ?? "",
    price: tour.price ?? 0,
    duration: tour.duration ?? 1,
    maxGroupSize: tour.maxGroupSize ?? 10,
    difficulty: tour.difficulty ?? "easy",
    imageCover: tour.imageCover ?? "",
  });

  const update = useMutation({
    mutationFn: () => adminService.updateTour(tour._id, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "tours"] });
      qc.invalidateQueries({ queryKey: ["admin", "tour", tour._id] });
      alert("Tour updated");
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to update tour";
      alert(message);
    },
  });

  const del = useMutation({
    mutationFn: () => adminService.deleteTour(tour._id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "tours"] });
      router.push("/admin/tours");
    },
  });

  return (
    <div>
      <Link
        href="/admin/tours"
        className="text-sm text-emerald-700 hover:underline"
      >
        ← Back to tours
      </Link>

      <h1 className="mt-2 text-3xl font-bold text-gray-900">Edit tour</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          update.mutate();
        }}
        className="mt-6 space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <Field label="Name">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Summary">
          <input
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Description">
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className={inputCls}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Price ($)">
            <input
              type="number"
              value={form.price}
              onChange={(e) =>
                setForm({ ...form, price: Number(e.target.value) })
              }
              className={inputCls}
            />
          </Field>
          <Field label="Duration (days)">
            <input
              type="number"
              value={form.duration}
              onChange={(e) =>
                setForm({ ...form, duration: Number(e.target.value) })
              }
              className={inputCls}
            />
          </Field>
          <Field label="Max group size">
            <input
              type="number"
              value={form.maxGroupSize}
              onChange={(e) =>
                setForm({
                  ...form,
                  maxGroupSize: Number(e.target.value),
                })
              }
              className={inputCls}
            />
          </Field>
          <Field label="Difficulty">
            <select
              value={form.difficulty}
              onChange={(e) =>
                setForm({
                  ...form,
                  difficulty: e.target.value as Difficulty,
                })
              }
              className={inputCls}
            >
              <option value="easy">easy</option>
              <option value="medium">medium</option>
              <option value="difficult">difficult</option>
            </select>
          </Field>
        </div>
        <Field label="Cover image URL">
          <input
            value={form.imageCover}
            onChange={(e) => setForm({ ...form, imageCover: e.target.value })}
            className={inputCls}
          />
        </Field>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={update.isPending}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {update.isPending ? "Saving…" : "Save changes"}
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm(`Delete tour "${tour.name}"?`)) del.mutate();
            }}
            disabled={del.isPending}
            className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
          >
            {del.isPending ? "Deleting…" : "Delete tour"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
    </div>
  );
}
