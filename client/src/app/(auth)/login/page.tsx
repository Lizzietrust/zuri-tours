"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { authService } from "@/services/auth";
import AuthHeader from "@/components/auth/AuthHeader";
import AuthCard from "@/components/auth/AuthCard";
import AuthAlert from "@/components/auth/AuthAlert";
import AuthFooter from "@/components/auth/AuthFooter";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const redirectTo = searchParams.get("redirect") || "/tours";

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await authService.login(form.email, form.password);
      queryClient.setQueryData(["me"], user);
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError((err as { message: string }).message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthHeader
        title="Welcome back"
        subtitle="Log in to your Zuri Tours account"
      />

      <AuthCard>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Email"
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <Input
            label="Password"
            type="password"
            name="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          {error && <AuthAlert type="error" message={error} />}

          <Button type="submit" loading={loading} fullWidth size="lg">
            {loading ? "Logging in…" : "Log in"}
          </Button>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <AuthFooter
              text=""
              linkText="Forgot password?"
              href="/forgot-password"
            />
            <AuthFooter text="" linkText="Create an account →" href="/signup" />
          </div>
        </form>
      </AuthCard>

      {/* Demo credentials helper (remove in production) */}
      {/* <div className="mt-6 rounded-lg border border-dashed border-emerald-300 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
        <p className="font-semibold">Test credentials</p>
        <p className="mt-1">
          Admin: <code>admin@example.com</code> / <code>Password123!</code>
        </p>
        <p>
          User: <code>alice@example.com</code> / <code>Password123!</code>
        </p>
      </div> */}
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
