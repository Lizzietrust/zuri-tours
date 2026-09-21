"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/auth";

export default function SettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, refetch } = useAuth();

  /* ---------- Profile form ---------- */
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    bio: user?.bio || "",
    phone: user?.phone || "",
  });
  const [profileStatus, setProfileStatus] = useState<{
    type: "idle" | "saving" | "ok" | "error";
    message?: string;
  }>({ type: "idle" });

  /* ---------- Password form ---------- */
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    password: "",
    passwordConfirm: "",
  });
  const [pwStatus, setPwStatus] = useState<{
    type: "idle" | "saving" | "ok" | "error";
    message?: string;
  }>({ type: "idle" });

  /* ---------- Delete account ---------- */
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileStatus({ type: "saving" });

    try {
      await authService.updateMe(profileForm);
      await refetch();
      queryClient.invalidateQueries({ queryKey: ["me"] });
      setProfileStatus({
        type: "ok",
        message: "Profile updated successfully",
      });
    } catch (err) {
      setProfileStatus({
        type: "error",
        message: (err as { message: string }).message,
      });
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwStatus({ type: "saving" });

    if (pwForm.password !== pwForm.passwordConfirm) {
      setPwStatus({ type: "error", message: "Passwords do not match" });
      return;
    }

    try {
      await authService.updatePassword(pwForm);
      setPwStatus({
        type: "ok",
        message: "Password updated. Please log in again.",
      });
      setTimeout(() => {
        router.push("/login");
        router.refresh();
      }, 1500);
    } catch (err) {
      setPwStatus({
        type: "error",
        message: (err as { message: string }).message,
      });
    }
  };

  const deleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await authService.deleteMe();
      queryClient.setQueryData(["me"], null);
      router.push("/");
      router.refresh();
    } catch (err) {
      alert((err as { message: string }).message);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>

        {/* Profile */}
        <form
          onSubmit={saveProfile}
          className="mt-8 space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold">Profile</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Name</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, name: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, email: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Bio</label>
              <textarea
                rows={3}
                value={profileForm.bio}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, bio: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>

          {profileStatus.message && (
            <p
              className={`text-sm ${
                profileStatus.type === "error"
                  ? "text-red-600"
                  : "text-emerald-700"
              }`}
            >
              {profileStatus.message}
            </p>
          )}

          <button
            type="submit"
            disabled={profileStatus.type === "saving"}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {profileStatus.type === "saving" ? "Saving…" : "Save changes"}
          </button>
        </form>

        {/* Password */}
        <form
          onSubmit={savePassword}
          className="mt-6 space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold">Change password</h2>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Current password
            </label>
            <input
              type="password"
              value={pwForm.currentPassword}
              onChange={(e) =>
                setPwForm({ ...pwForm, currentPassword: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">
                New password
              </label>
              <input
                type="password"
                value={pwForm.password}
                onChange={(e) =>
                  setPwForm({ ...pwForm, password: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Confirm new password
              </label>
              <input
                type="password"
                value={pwForm.passwordConfirm}
                onChange={(e) =>
                  setPwForm({ ...pwForm, passwordConfirm: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>

          {pwStatus.message && (
            <p
              className={`text-sm ${
                pwStatus.type === "error" ? "text-red-600" : "text-emerald-700"
              }`}
            >
              {pwStatus.message}
            </p>
          )}

          <button
            type="submit"
            disabled={pwStatus.type === "saving"}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {pwStatus.type === "saving" ? "Updating…" : "Update password"}
          </button>
        </form>

        {/* Danger zone */}
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="text-lg font-semibold text-red-800">Danger zone</h2>
          <p className="mt-1 text-sm text-red-700">
            Deleting your account is permanent. All your reviews and data will
            be removed.
          </p>

          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="mt-4 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
            >
              Delete my account
            </button>
          ) : (
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={deleteAccount}
                disabled={deleteLoading}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleteLoading ? "Deleting…" : "Yes, delete forever"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
