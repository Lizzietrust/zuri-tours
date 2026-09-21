"use client";

import { useState } from "react";

import { authService } from "@/services/auth";
import AuthHeader from "@/components/auth/AuthHeader";
import AuthCard from "@/components/auth/AuthCard";
import AuthAlert from "@/components/auth/AuthAlert";
import AuthFooter from "@/components/auth/AuthFooter";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<{
    type: "idle" | "sending" | "ok" | "error";
    message?: string;
  }>({ type: "idle" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: "sending" });

    try {
      await authService.forgotPassword(email);
      setStatus({
        type: "ok",
        message:
          "If that email exists, a reset link has been sent. Check your inbox.",
      });
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
        title="Forgot password?"
        subtitle="Enter your email and we'll send you a reset link."
      />

      <AuthCard>
        <form onSubmit={submit} className="space-y-5">
          <Input
            label="Email"
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {status.message && (
            <AuthAlert
              type={status.type === "error" ? "error" : "success"}
              message={status.message}
            />
          )}

          <Button
            type="submit"
            loading={status.type === "sending"}
            fullWidth
            size="lg"
          >
            {status.type === "sending" ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      </AuthCard>

      <AuthFooter
        text="Remembered it?"
        linkText="Back to login"
        href="/login"
      />
    </>
  );
}
