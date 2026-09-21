"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { authService } from "@/services/auth";
import AuthHeader from "@/components/auth/AuthHeader";
import AuthCard from "@/components/auth/AuthCard";
import AuthAlert from "@/components/auth/AuthAlert";
import AuthFooter from "@/components/auth/AuthFooter";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const token = params.token as string;

  const [form, setForm] = useState({ password: "", passwordConfirm: "" });
  const [status, setStatus] = useState<{
    type: "idle" | "saving" | "ok" | "error";
    message?: string;
  }>({ type: "idle" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.passwordConfirm) {
      setStatus({ type: "error", message: "Passwords do not match" });
      return;
    }

    setStatus({ type: "saving" });

    try {
      const user = await authService.resetPassword(token, form);
      queryClient.setQueryData(["me"], user);
      setStatus({ type: "ok", message: "Password reset! Redirecting…" });
      setTimeout(() => {
        router.push("/tours");
        router.refresh();
      }, 1200);
    } catch (err) {
      setStatus({
        type: "error",
        message: (err as { message: string }).message,
      });
    }
  };

  return (
    <>
      <AuthHeader
        title="Reset your password"
        subtitle="Choose a new password for your account."
      />

      <AuthCard>
        <form onSubmit={submit} className="space-y-5">
          <Input
            label="New password"
            type="password"
            name="password"
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="••••••••"
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

          {status.message && (
            <AuthAlert
              type={status.type === "error" ? "error" : "success"}
              message={status.message}
            />
          )}

          <Button
            type="submit"
            loading={status.type === "saving"}
            fullWidth
            size="lg"
          >
            {status.type === "saving" ? "Resetting…" : "Reset password"}
          </Button>
        </form>
      </AuthCard>

      <AuthFooter text="" linkText="Back to login" href="/login" />
    </>
  );
}
