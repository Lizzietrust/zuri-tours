"use client";

import { useState } from "react";
import { useGuideProfile, useUpdateGuideProfile } from "@/hooks/useGuide";
import type { Guide } from "@/types";

type FormState = {
  name: string;
  bio: string;
  phoneNumber: string;
  experienceYears: number;
  languages: string;
  certifications: string;
};

function guideToForm(g: Guide): FormState {
  return {
    name: g.name ?? "",
    bio: g.bio ?? "",
    phoneNumber: g.phoneNumber ?? "",
    experienceYears: g.experienceYears ?? 0,
    languages: (g.languages ?? []).join(", "),
    certifications: (g.certifications ?? []).join(", "),
  };
}

export default function GuideProfilePage() {
  const { data: guide, isLoading, isError } = useGuideProfile();
  const update = useUpdateGuideProfile();

  /**
   * `null` means "no local edits yet — mirror the server".
   * Once the user types, we store an override and render from that.
   * After a successful save we reset back to null so the fresh
   * server data becomes the source of truth again.
   */
  const [override, setOverride] = useState<FormState | null>(null);

  const form: FormState = override ?? (guide ? guideToForm(guide) : EMPTY);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setOverride((prev) => ({
      ...(prev ?? (guide ? guideToForm(guide) : EMPTY)),
      [key]: value,
    }));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    update.mutate(
      {
        name: form.name,
        bio: form.bio,
        phoneNumber: form.phoneNumber,
        experienceYears: Number(form.experienceYears) || 0,
        languages: form.languages
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        certifications: form.certifications
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      },
      {
        onSuccess: () => setOverride(null),
      },
    );
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="h-64 animate-pulse rounded-2xl border border-gray-200 bg-white" />
      </div>
    );
  }

  if (isError || !guide) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          Failed to load your guide profile.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">
        Guide profile
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Update your details so travelers know who they&apos;ll be exploring
        with.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-8 space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <Field label="Name">
          <input
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            className={inputCls}
          />
        </Field>

        <Field label="Bio">
          <textarea
            rows={4}
            value={form.bio}
            onChange={(e) => setField("bio", e.target.value)}
            placeholder="Tell travelers about your experience, style, and what makes your tours special."
            className={inputCls}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone number">
            <input
              type="tel"
              value={form.phoneNumber}
              onChange={(e) => setField("phoneNumber", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Years of experience">
            <input
              type="number"
              min={0}
              max={50}
              value={form.experienceYears}
              onChange={(e) =>
                setField("experienceYears", Number(e.target.value))
              }
              className={inputCls}
            />
          </Field>
        </div>

        <Field
          label="Languages"
          hint="Comma-separated, e.g. English, French, Swahili"
        >
          <input
            value={form.languages}
            onChange={(e) => setField("languages", e.target.value)}
            className={inputCls}
          />
        </Field>

        <Field
          label="Certifications"
          hint="Comma-separated, e.g. Wilderness First Aid, PADI"
        >
          <input
            value={form.certifications}
            onChange={(e) => setField("certifications", e.target.value)}
            className={inputCls}
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="submit"
            disabled={update.isPending || override === null}
            className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {update.isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

const EMPTY: FormState = {
  name: "",
  bio: "",
  phoneNumber: "",
  experienceYears: 0,
  languages: "",
  certifications: "",
};

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
