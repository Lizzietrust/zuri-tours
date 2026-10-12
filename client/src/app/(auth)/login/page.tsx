"use client";

import { useState, Suspense, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { authService } from "@/services/auth";
import AuthHeader from "@/components/auth/AuthHeader";
import AuthCard from "@/components/auth/AuthCard";
import AuthFooter from "@/components/auth/AuthFooter";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const DEFAULT_REDIRECT = "/tours";

function getSafeRedirect(value: string | null): string {
  if (
    value &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.startsWith("/\\")
  ) {
    return value;
  }
  return DEFAULT_REDIRECT;
}

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const redirectTo = getSafeRedirect(searchParams.get("redirect"));

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const user = await authService.login(form.email.trim(), form.password);
      queryClient.setQueryData(["me"], user);

      toast.success(
        `Welcome back, ${user.name?.split(" ")[0] ?? "traveler"}!`,
        {
          description: "You've logged in successfully.",
        },
      );

      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      const message =
        (err as { message?: string })?.message ||
        "Please check your details and try again.";

      toast.error("Login failed", { description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthHeader
        title="Welcome back"
        subtitle="Log in to continue your journey with Zuri Tours"
      />

      <AuthCard>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Email"
            type="email"
            name="email"
            required
            autoFocus
            autoComplete="email"
            placeholder="you@example.com"
            leftIcon={<MailIcon />}
            disabled={loading}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <div>
            <Input
              label="Password"
              type="password"
              name="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              leftIcon={<LockIcon />}
              disabled={loading}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <div className="mt-2 text-right">
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            loading={loading}
            fullWidth
            size="lg"
            className="shadow-lg shadow-emerald-600/20"
          >
            {loading ? "Logging in…" : "Log in"}
          </Button>
        </form>
      </AuthCard>

      <AuthFooter
        text="New to Zuri Tours?"
        linkText="Create an account →"
        href="/signup"
      />
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-sm text-gray-500">Loading…</div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
