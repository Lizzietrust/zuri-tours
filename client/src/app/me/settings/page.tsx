"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/auth";

type Status = {
  type: "idle" | "saving" | "ok" | "error";
  message?: string;
};

type ProfileForm = {
  name: string;
  email: string;
  bio: string;
  phone: string;
};

const PROFILE_FIELDS: (keyof ProfileForm)[] = ["name", "email", "bio", "phone"];

const MIN_PASSWORD_LENGTH = 8;
const BIO_MAX = 300;

const INPUT_CLASS =
  "w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:bg-gray-50 disabled:text-gray-500";

const LABEL_CLASS = "mb-1.5 block text-sm font-medium text-gray-700";

const PRIMARY_BTN =
  "rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 hover:shadow-emerald-700/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-60 disabled:shadow-none";

function StatusMessage({ status }: { status: Status }) {
  if (!status.message) return null;
  const isError = status.type === "error";
  return (
    <p
      role={isError ? "alert" : "status"}
      className={`rounded-xl border px-4 py-3 text-sm ${
        isError
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-emerald-200 bg-emerald-50 text-emerald-800"
      }`}
    >
      {status.message}
    </p>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div
        aria-hidden
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xl"
      >
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="mt-0.5 text-sm text-gray-600">{subtitle}</p>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, refetch } = useAuth();
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---------- Profile form ----------
     We never copy `user` into state. Instead:
       - baseProfile  = values derived from the current user
       - profileDraft = only the fields the person has edited
       - profileForm  = baseProfile overlaid with profileDraft (derived)
  */
  const baseProfile = useMemo<ProfileForm>(
    () => ({
      name: user?.name ?? "",
      email: user?.email ?? "",
      bio: user?.bio ?? "",
      phone: user?.phone ?? "",
    }),
    [user],
  );
  const [profileDraft, setProfileDraft] = useState<Partial<ProfileForm>>({});
  const profileForm: ProfileForm = { ...baseProfile, ...profileDraft };
  const [profileStatus, setProfileStatus] = useState<Status>({ type: "idle" });

  /* ---------- Password form ---------- */
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    password: "",
    passwordConfirm: "",
  });
  const [pwStatus, setPwStatus] = useState<Status>({ type: "idle" });
  const [showPw, setShowPw] = useState(false);

  /* ---------- Delete account ---------- */
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  /* Clear pending redirect on unmount (no setState here) */
  useEffect(() => {
    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, []);

  const isProfileDirty =
    !!user && PROFILE_FIELDS.some((f) => profileForm[f] !== baseProfile[f]);

  const initial = (user?.name || user?.email || "?")
    .trim()
    .charAt(0)
    .toUpperCase();

  const updateProfileField = (field: keyof ProfileForm, value: string) => {
    setProfileDraft((prev) => ({ ...prev, [field]: value }));
    if (profileStatus.type !== "idle" && profileStatus.type !== "saving") {
      setProfileStatus({ type: "idle" });
    }
  };

  const updatePwField = (field: keyof typeof pwForm, value: string) => {
    setPwForm((prev) => ({ ...prev, [field]: value }));
    if (pwStatus.type !== "idle" && pwStatus.type !== "saving") {
      setPwStatus({ type: "idle" });
    }
  };

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();

    if (!profileForm.name.trim()) {
      setProfileStatus({ type: "error", message: "Name is required" });
      return;
    }
    if (!profileForm.email.trim()) {
      setProfileStatus({ type: "error", message: "Email is required" });
      return;
    }

    setProfileStatus({ type: "saving" });

    try {
      await authService.updateMe({
        ...profileForm,
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
        phone: profileForm.phone.trim(),
        bio: profileForm.bio.trim(),
      });
      await refetch();
      queryClient.invalidateQueries({ queryKey: ["me"] });
      setProfileDraft({});
      setProfileStatus({
        type: "ok",
        message: "Profile updated successfully",
      });
    } catch (err) {
      setProfileStatus({
        type: "error",
        message:
          (err as { message?: string }).message ?? "Something went wrong",
      });
    }
  };

  const savePassword = async (e: FormEvent) => {
    e.preventDefault();

    if (
      !pwForm.currentPassword ||
      !pwForm.password ||
      !pwForm.passwordConfirm
    ) {
      setPwStatus({ type: "error", message: "Please fill in all fields" });
      return;
    }
    if (pwForm.password.length < MIN_PASSWORD_LENGTH) {
      setPwStatus({
        type: "error",
        message: `New password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      });
      return;
    }
    if (pwForm.password !== pwForm.passwordConfirm) {
      setPwStatus({ type: "error", message: "Passwords do not match" });
      return;
    }

    setPwStatus({ type: "saving" });

    try {
      await authService.updatePassword(pwForm);
      setPwStatus({
        type: "ok",
        message: "Password updated. Redirecting you to log in again…",
      });
      setPwForm({ currentPassword: "", password: "", passwordConfirm: "" });
      redirectTimer.current = setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err) {
      setPwStatus({
        type: "error",
        message:
          (err as { message?: string }).message ?? "Something went wrong",
      });
    }
  };

  const deleteAccount = async () => {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await authService.deleteMe();
      queryClient.setQueryData(["me"], null);
      queryClient.removeQueries({ queryKey: ["me"] });
      router.push("/");
      router.refresh();
    } catch (err) {
      setDeleteError(
        (err as { message?: string }).message ?? "Failed to delete account",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const cancelDelete = () => {
    setConfirmDelete(false);
    setDeleteText("");
    setDeleteError(null);
  };

  const pwMismatch =
    pwForm.passwordConfirm.length > 0 &&
    pwForm.password !== pwForm.passwordConfirm;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white">
        {/* ============================ HERO ============================ */}
        <section className="relative overflow-hidden bg-linear-to-br from-emerald-50 via-white to-sky-50">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-emerald-200/40 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl"
          />

          <div className="relative mx-auto max-w-3xl px-6 py-12 sm:py-14">
            <Link
              href="/me"
              className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              ← Back to your account
            </Link>

            <div className="mt-5 flex flex-wrap items-center gap-5">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-emerald-500 to-sky-500 text-2xl font-bold text-white shadow-md">
                {initial}
              </span>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                  <span className="bg-linear-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent">
                    Settings
                  </span>
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Update your profile details and keep your account secure
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================ FORMS ============================ */}
        <div className="mx-auto max-w-3xl space-y-6 px-6 py-12">
          {/* ---------- Profile ---------- */}
          <form
            onSubmit={saveProfile}
            noValidate
            className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
          >
            <SectionHeader
              icon="👤"
              title="Profile"
              subtitle="This information is shown on your account and reviews."
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className={LABEL_CLASS}>
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={profileForm.name}
                  onChange={(e) => updateProfileField("name", e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label htmlFor="email" className={LABEL_CLASS}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={profileForm.email}
                  onChange={(e) => updateProfileField("email", e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="phone" className={LABEL_CLASS}>
                  Phone
                </label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  value={profileForm.phone}
                  onChange={(e) => updateProfileField("phone", e.target.value)}
                  placeholder="+234 800 000 0000"
                  className={INPUT_CLASS}
                />
              </div>
              <div className="sm:col-span-2">
                <div className="flex items-end justify-between">
                  <label htmlFor="bio" className={LABEL_CLASS}>
                    Bio
                  </label>
                  <span className="mb-1.5 text-xs text-gray-400">
                    {profileForm.bio.length}/{BIO_MAX}
                  </span>
                </div>
                <textarea
                  id="bio"
                  rows={3}
                  maxLength={BIO_MAX}
                  value={profileForm.bio}
                  onChange={(e) => updateProfileField("bio", e.target.value)}
                  placeholder="Tell other travelers a little about yourself…"
                  className={`${INPUT_CLASS} resize-none`}
                />
              </div>
            </div>

            <StatusMessage status={profileStatus} />

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={
                  profileStatus.type === "saving" || !user || !isProfileDirty
                }
                className={PRIMARY_BTN}
              >
                {profileStatus.type === "saving" ? "Saving…" : "Save changes"}
              </button>
              {isProfileDirty && profileStatus.type !== "saving" && (
                <span className="text-xs text-gray-500">
                  You have unsaved changes
                </span>
              )}
            </div>
          </form>

          {/* ---------- Password ---------- */}
          <form
            onSubmit={savePassword}
            noValidate
            className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
          >
            <SectionHeader
              icon="🔒"
              title="Change password"
              subtitle={`Use at least ${MIN_PASSWORD_LENGTH} characters. You'll be asked to log in again.`}
            />

            <div>
              <label htmlFor="currentPassword" className={LABEL_CLASS}>
                Current password
              </label>
              <input
                id="currentPassword"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                value={pwForm.currentPassword}
                onChange={(e) =>
                  updatePwField("currentPassword", e.target.value)
                }
                className={INPUT_CLASS}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="password" className={LABEL_CLASS}>
                  New password
                </label>
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="new-password"
                  value={pwForm.password}
                  onChange={(e) => updatePwField("password", e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label htmlFor="passwordConfirm" className={LABEL_CLASS}>
                  Confirm new password
                </label>
                <input
                  id="passwordConfirm"
                  type={showPw ? "text" : "password"}
                  autoComplete="new-password"
                  aria-invalid={pwMismatch}
                  value={pwForm.passwordConfirm}
                  onChange={(e) =>
                    updatePwField("passwordConfirm", e.target.value)
                  }
                  className={`${INPUT_CLASS} ${
                    pwMismatch
                      ? "border-amber-400 focus:border-amber-400 focus:ring-amber-100"
                      : ""
                  }`}
                />
                {pwMismatch && (
                  <p className="mt-1 text-xs text-amber-700">
                    Passwords don&apos;t match yet
                  </p>
                )}
              </div>
            </div>

            <label className="flex w-fit items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showPw}
                onChange={(e) => setShowPw(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 accent-emerald-600"
              />
              Show passwords
            </label>

            <StatusMessage status={pwStatus} />

            <button
              type="submit"
              disabled={pwStatus.type === "saving"}
              className={PRIMARY_BTN}
            >
              {pwStatus.type === "saving" ? "Updating…" : "Update password"}
            </button>
          </form>

          {/* ---------- Danger zone ---------- */}
          <div className="rounded-2xl border border-red-200 bg-red-50/70 p-6">
            <div className="flex items-start gap-4">
              <div
                aria-hidden
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-xl"
              >
                ⚠️
              </div>
              <div>
                <h2 className="text-lg font-semibold text-red-800">
                  Danger zone
                </h2>
                <p className="mt-0.5 text-sm text-red-700">
                  Deleting your account is permanent. All your reviews and data
                  will be removed.
                </p>
              </div>
            </div>

            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="mt-5 rounded-xl border border-red-300 bg-white px-5 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
              >
                Delete my account
              </button>
            ) : (
              <div className="mt-5 space-y-3">
                <div>
                  <label
                    htmlFor="deleteConfirm"
                    className="mb-1.5 block text-sm font-medium text-red-800"
                  >
                    Type <span className="font-bold">DELETE</span> to confirm
                  </label>
                  <input
                    id="deleteConfirm"
                    type="text"
                    value={deleteText}
                    onChange={(e) => setDeleteText(e.target.value)}
                    autoComplete="off"
                    className="w-full max-w-xs rounded-xl border border-red-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-red-400 focus:outline-none focus:ring-4 focus:ring-red-100"
                  />
                </div>

                {deleteError && (
                  <p
                    role="alert"
                    className="rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-red-700"
                  >
                    {deleteError}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={deleteAccount}
                    disabled={deleteLoading || deleteText !== "DELETE"}
                    className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                  >
                    {deleteLoading ? "Deleting…" : "Yes, delete forever"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelDelete}
                    disabled={deleteLoading}
                    className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
