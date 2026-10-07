"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminService } from "@/services/admin";
import type { User } from "@/types";

const ROLES = ["user", "guide", "lead-guide", "admin"] as const;

export default function AdminUserEditPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin", "user", id],
    queryFn: () => adminService.getUser(id),
  });

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />;
  }

  if (isError || !user) {
    return <p className="text-sm text-red-600">User not found.</p>;
  }

  return <EditUserForm key={user._id} user={user} />;
}

function EditUserForm({ user }: { user: User }) {
  const router = useRouter();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    name: user.name ?? "",
    email: user.email ?? "",
    role: user.role ?? "user",
    photo: user.photo ?? "",
    bio: user.bio ?? "",
    phoneNumber: user.phoneNumber ?? user.phone ?? "",
  });
  const [status, setStatus] = useState<{
    type: "ok" | "error";
    message: string;
  } | null>(null);

  const update = useMutation({
    mutationFn: () => adminService.updateUser(user._id, form),
    onSuccess: () => {
      setStatus({ type: "ok", message: "User updated successfully" });
      qc.invalidateQueries({ queryKey: ["admin", "user", user._id] });
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to update user";
      setStatus({ type: "error", message });
    },
  });

  const permanentDelete = useMutation({
    mutationFn: () => adminService.permanentDeleteUser(user._id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      router.push("/admin/users");
    },
  });

  return (
    <div>
      <Link
        href="/admin/users"
        className="text-sm text-emerald-700 hover:underline"
      >
        ← Back to users
      </Link>

      <h1 className="mt-2 text-3xl font-bold text-gray-900">Edit user</h1>
      <p className="mt-1 text-sm text-gray-500">{user.email}</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setStatus(null);
          update.mutate();
        }}
        className="mt-6 space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Role">
            <select
              value={form.role}
              onChange={(e) =>
                setForm({
                  ...form,
                  role: e.target.value as User["role"],
                })
              }
              className={inputCls}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Phone">
            <input
              value={form.phoneNumber}
              onChange={(e) =>
                setForm({ ...form, phoneNumber: e.target.value })
              }
              className={inputCls}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Photo URL">
              <input
                value={form.photo}
                onChange={(e) => setForm({ ...form, photo: e.target.value })}
                className={inputCls}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Bio">
              <textarea
                rows={3}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className={inputCls}
              />
            </Field>
          </div>
        </div>

        {status && (
          <p
            className={`text-sm ${
              status.type === "error" ? "text-red-600" : "text-emerald-700"
            }`}
          >
            {status.message}
          </p>
        )}

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
            onClick={() => router.push("/admin/users")}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Danger zone */}
      <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-800">Danger zone</h2>
        <p className="mt-1 text-sm text-red-700">
          Permanently delete this user. This cannot be undone.
        </p>
        <button
          onClick={() => {
            if (
              confirm(
                `Permanently delete "${user.name}"? This cannot be undone.`,
              )
            ) {
              permanentDelete.mutate();
            }
          }}
          disabled={permanentDelete.isPending}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
        >
          {permanentDelete.isPending ? "Deleting…" : "Permanently delete"}
        </button>
      </div>
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
