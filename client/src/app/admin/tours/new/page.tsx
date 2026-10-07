"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { adminService } from "@/services/admin";
import type { Tour } from "@/types";

type Difficulty = Tour["difficulty"];

type FormState = {
  name: string;
  summary: string;
  description: string;
  price: number;
  duration: number;
  maxGroupSize: number;
  difficulty: Difficulty;
  imageCover: string;
};

const INITIAL_FORM: FormState = {
  name: "",
  summary: "",
  description: "",
  price: 0,
  duration: 1,
  maxGroupSize: 10,
  difficulty: "easy",
  imageCover: "",
};

export default function NewTourPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () => adminService.createTour(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "tours"] });
      router.push("/admin/tours");
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to create tour";
      setError(message);
    },
  });

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">New tour</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          create.mutate();
        }}
        className="mt-6 space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <Field label="Name">
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Summary">
          <input
            required
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Description">
          <textarea
            required
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
              min={0}
              required
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
              min={1}
              required
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
              min={1}
              required
              value={form.maxGroupSize}
              onChange={(e) =>
                setForm({ ...form, maxGroupSize: Number(e.target.value) })
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

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={create.isPending}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {create.isPending ? "Creating…" : "Create tour"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
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
