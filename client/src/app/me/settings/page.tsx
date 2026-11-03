"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/auth";
import { getInitials, getPhotoUrl } from "@/lib/user";

type Status = {
  type: "idle" | "saving" | "ok" | "error";
  message?: string;
};

type ProfileForm = {
  name: string;
  email: string;
  photo: string;
  bio: string;
  phoneNumber: string;
  dateOfBirth: string;
  languages: string;
  expertise: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  newsletter: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
};

const MIN_PASSWORD_LENGTH = 8;
const BIO_MAX = 500;
const DEFAULT_PHOTO = "default.jpg";

const INPUT_CLASS =
  "w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:bg-gray-50 disabled:text-gray-500";

const LABEL_CLASS = "mb-1.5 block text-sm font-medium text-gray-700";

const PRIMARY_BTN =
  "rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 hover:shadow-emerald-700/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-60 disabled:shadow-none";

const splitList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const isImageSrc = (value?: string) =>
  !!value && (/^https?:\/\//i.test(value) || value.startsWith("/"));

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

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="border-t border-gray-100 pt-5 text-sm font-semibold uppercase tracking-wide text-gray-500">
      {children}
    </h3>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  hint,
  disabled,
  max,
  className,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  hint?: string;
  disabled?: boolean;
  max?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        max={max}
        className={INPUT_CLASS}
      />
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 px-4 py-3 transition hover:border-emerald-200"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-emerald-600"
      />
      <span>
        <span className="block text-sm font-medium text-gray-800">{label}</span>
        <span className="block text-xs text-gray-500">{description}</span>
      </span>
    </label>
  );
}

function Avatar({
  src,
  initial,
  className,
}: {
  src?: string;
  initial: string;
  className: string;
}) {
  if (isImageSrc(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" className={`${className} object-cover`} />
    );
  }
  return (
    <span
      className={`${className} flex items-center justify-center bg-linear-to-br from-emerald-500 to-sky-500 font-bold text-white`}
    >
      {initial}
    </span>
  );
}

function PhotoUpload({
  photo,
  initials,
  onChange,
}: {
  photo: string;
  initials: string;
  onChange: (value: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Image is too large. Please pick a file under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onChange(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar
          src={isImageSrc(photo) ? photo : (getPhotoUrl(photo) ?? undefined)}
          initial={initials}
          className="h-16 w-16 shrink-0 rounded-full text-xl shadow-sm"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Upload profile photo"
          title="Upload profile photo"
          className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-emerald-600 text-white shadow-md transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
        >
          {/* Camera / upload icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
            aria-hidden
          >
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
            <circle cx="12" cy="13" r="3" />
          </svg>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
        />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-800">Profile photo</p>
        <p className="text-xs text-gray-500">
          Click the camera icon to upload a new photo.
        </p>
        {photo && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="mt-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
          >
            Remove photo
          </button>
        )}
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
      photo: user?.photo && user.photo !== DEFAULT_PHOTO ? user.photo : "",
      bio: user?.bio ?? "",
      phoneNumber: user?.phoneNumber ?? "",
      dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.slice(0, 10) : "",
      languages: (user?.languages ?? []).join(", "),
      expertise: (user?.expertise ?? []).join(", "),
      street: user?.address?.street ?? "",
      city: user?.address?.city ?? "",
      state: user?.address?.state ?? "",
      country: user?.address?.country ?? "",
      postalCode: user?.address?.postalCode ?? "",
      newsletter: user?.preferences?.newsletter ?? false,
      emailNotifications: user?.preferences?.emailNotifications ?? true,
      smsNotifications: user?.preferences?.smsNotifications ?? false,
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
    !!user &&
    (Object.keys(profileForm) as (keyof ProfileForm)[]).some(
      (field) => profileForm[field] !== baseProfile[field],
    );

  const initials = getInitials(user?.name, user?.email);

  const today = new Date().toISOString().slice(0, 10);

  const updateProfileField = <K extends keyof ProfileForm>(
    field: K,
    value: ProfileForm[K],
  ) => {
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

    const name = profileForm.name.trim();
    const photo = profileForm.photo.trim();
    const phoneNumber = profileForm.phoneNumber.replace(/[^\d+]/g, "");

    if (name.length < 2 || name.length > 50) {
      setProfileStatus({
        type: "error",
        message: "Name must be between 2 and 50 characters",
      });
      return;
    }
    if (photo && !isImageSrc(photo) && !photo.startsWith("data:image/")) {
      setProfileStatus({
        type: "error",
        message: "Profile photo must be an uploaded image or a valid link",
      });
      return;
    }
    if (phoneNumber && !/^\+?\d{7,15}$/.test(phoneNumber)) {
      setProfileStatus({
        type: "error",
        message: "Enter a valid phone number (7–15 digits)",
      });
      return;
    }
    if (profileForm.dateOfBirth && profileForm.dateOfBirth > today) {
      setProfileStatus({
        type: "error",
        message: "Date of birth cannot be in the future",
      });
      return;
    }

    setProfileStatus({ type: "saving" });

    try {
      await authService.updateMe({
        name,
        photo: photo || DEFAULT_PHOTO,
        bio: profileForm.bio.trim(),
        phoneNumber,
        dateOfBirth: profileForm.dateOfBirth || null,
        languages: splitList(profileForm.languages),
        expertise: splitList(profileForm.expertise),
        address: {
          street: profileForm.street.trim(),
          city: profileForm.city.trim(),
          state: profileForm.state.trim(),
          country: profileForm.country.trim(),
          postalCode: profileForm.postalCode.trim(),
        },
        preferences: {
          newsletter: profileForm.newsletter,
          emailNotifications: profileForm.emailNotifications,
          smsNotifications: profileForm.smsNotifications,
        },
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
              <Avatar
                src={getPhotoUrl(baseProfile.photo) ?? undefined}
                initial={initials}
                className="h-16 w-16 shrink-0 rounded-full text-2xl shadow-md"
              />
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
            {/* Photo + name as the section header */}
            <div className="flex items-center gap-4">
              <PhotoUpload
                photo={profileForm.photo}
                initials={initials}
                onChange={(v) => updateProfileField("photo", v)}
              />
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-gray-900">
                  {profileForm.name || "Your profile"}
                </h2>
                <p className="mt-0.5 text-sm text-gray-600">
                  This information is shown on your account and reviews.
                </p>
              </div>
            </div>

            {/* --- Basics --- */}
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="name"
                label="Name"
                autoComplete="name"
                value={profileForm.name}
                onChange={(v) => updateProfileField("name", v)}
              />
              <TextField
                id="email"
                label="Email"
                type="email"
                autoComplete="email"
                value={profileForm.email}
                onChange={() => {}}
                disabled
                hint="Email can't be changed here."
              />
              <TextField
                id="phoneNumber"
                label="Phone"
                type="tel"
                autoComplete="tel"
                value={profileForm.phoneNumber}
                onChange={(v) => updateProfileField("phoneNumber", v)}
                placeholder="+234 800 000 0000"
              />
              <TextField
                id="dateOfBirth"
                label="Date of birth"
                type="date"
                autoComplete="bday"
                max={today}
                value={profileForm.dateOfBirth}
                onChange={(v) => updateProfileField("dateOfBirth", v)}
              />
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

            {/* --- Languages & expertise --- */}
            <SubHeading>Languages &amp; expertise</SubHeading>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="languages"
                label="Languages"
                value={profileForm.languages}
                onChange={(v) => updateProfileField("languages", v)}
                placeholder="English, Yoruba, French"
                hint="Separate with commas."
              />
              <TextField
                id="expertise"
                label="Expertise"
                value={profileForm.expertise}
                onChange={(v) => updateProfileField("expertise", v)}
                placeholder="Hiking, Photography"
                hint="Separate with commas."
              />
            </div>

            {/* --- Address --- */}
            <SubHeading>Address</SubHeading>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="street"
                label="Street"
                autoComplete="street-address"
                value={profileForm.street}
                onChange={(v) => updateProfileField("street", v)}
                className="sm:col-span-2"
              />
              <TextField
                id="city"
                label="City"
                autoComplete="address-level2"
                value={profileForm.city}
                onChange={(v) => updateProfileField("city", v)}
              />
              <TextField
                id="state"
                label="State / Region"
                autoComplete="address-level1"
                value={profileForm.state}
                onChange={(v) => updateProfileField("state", v)}
              />
              <TextField
                id="country"
                label="Country"
                autoComplete="country-name"
                value={profileForm.country}
                onChange={(v) => updateProfileField("country", v)}
              />
              <TextField
                id="postalCode"
                label="Postal code"
                autoComplete="postal-code"
                value={profileForm.postalCode}
                onChange={(v) => updateProfileField("postalCode", v)}
              />
            </div>

            {/* --- Preferences --- */}
            <SubHeading>Preferences</SubHeading>
            <div className="space-y-3">
              <ToggleRow
                id="newsletter"
                label="Newsletter"
                description="Occasional news and tour announcements."
                checked={profileForm.newsletter}
                onChange={(v) => updateProfileField("newsletter", v)}
              />
              <ToggleRow
                id="emailNotifications"
                label="Email notifications"
                description="Booking updates and review replies by email."
                checked={profileForm.emailNotifications}
                onChange={(v) => updateProfileField("emailNotifications", v)}
              />
              <ToggleRow
                id="smsNotifications"
                label="SMS notifications"
                description="Important booking updates by text message."
                checked={profileForm.smsNotifications}
                onChange={(v) => updateProfileField("smsNotifications", v)}
              />
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
