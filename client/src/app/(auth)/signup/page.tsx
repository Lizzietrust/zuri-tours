"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { authService } from "@/services/auth";
import AuthHeader from "@/components/auth/AuthHeader";
import AuthCard from "@/components/auth/AuthCard";
import AuthAlert from "@/components/auth/AuthAlert";
import AuthFooter from "@/components/auth/AuthFooter";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function SignupPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.password !== form.passwordConfirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const user = await authService.register(form);
      queryClient.setQueryData(["me"], user);
      router.push("/tours");
      router.refresh();
    } catch (err) {
      setError((err as { message: string }).message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthHeader
        title="Create account"
        subtitle="Join Zuri Tours and start exploring"
      />

      <AuthCard>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Full name"
            type="text"
            name="name"
            required
            minLength={2}
            maxLength={50}
            placeholder="Jane Doe"
            autoComplete="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

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
            minLength={6}
            autoComplete="new-password"
            placeholder="••••••••"
            hint="Min 6 chars, 1 uppercase, 1 number, 1 symbol"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <Input
            label="Confirm password"
            type="password"
            name="passwordConfirm"
            required
            autoComplete="new-password"
            placeholder="••••••••"
            value={form.passwordConfirm}
            onChange={(e) =>
              setForm({ ...form, passwordConfirm: e.target.value })
            }
          />

          {error && <AuthAlert type="error" message={error} />}

          <Button type="submit" loading={loading} fullWidth size="lg">
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </form>
      </AuthCard>

      <AuthFooter
        text="Already have an account?"
        linkText="Log in"
        href="/login"
      />
    </>
  );
}
