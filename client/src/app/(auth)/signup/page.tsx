"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { authService } from "@/services/auth";
import AuthHeader from "@/components/auth/AuthHeader";
import AuthCard from "@/components/auth/AuthCard";
import AuthFooter from "@/components/auth/AuthFooter";
import { User, Mail, Lock } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const PASSWORD_RULES = [
  { label: "6+ characters", test: (p: string) => p.length >= 6 },
  { label: "1 uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "1 number", test: (p: string) => /\d/.test(p) },
  { label: "1 symbol", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function PasswordRules({ password }: { password: string }) {
  return (
    <ul
      aria-label="Password requirements"
      className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1"
    >
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);
        return (
          <li
            key={rule.label}
            className={`flex items-center gap-1.5 text-xs transition-colors ${
              met ? "font-medium text-emerald-700" : "text-gray-500"
            }`}
          >
            <span
              aria-hidden
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${
                met
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {met ? "✓" : "•"}
            </span>
            {rule.label}
            <span className="sr-only">{met ? " (met)" : " (not met)"}</span>
          </li>
        );
      })}
    </ul>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });
  const [loading, setLoading] = useState(false);

  const mismatch =
    form.passwordConfirm !== "" && form.password !== form.passwordConfirm;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading || mismatch) return;
    setLoading(true);

    try {
      const user = await authService.register({
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
      });
      queryClient.setQueryData(["me"], user);

      toast.success(
        `Welcome to Zuri Tours, ${user.name?.split(" ")[0] ?? "traveler"}!`,
        { description: "Your account has been created." },
      );

      router.push("/tours");
      router.refresh();
    } catch (err) {
      const message =
        (err as { message?: string })?.message ||
        "Please check your details and try again.";

      toast.error("Signup failed", { description: message });
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
            autoFocus
            minLength={2}
            maxLength={50}
            placeholder="Jane Doe"
            autoComplete="name"
            leftIcon={<User className="h-4 w-4" />}
            disabled={loading}
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
            leftIcon={<Mail className="h-4 w-4" />}
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
              minLength={6}
              autoComplete="new-password"
              placeholder="••••••••"
              leftIcon={<Lock className="h-4 w-4" />}
              disabled={loading}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            {form.password.length > 0 && (
              <PasswordRules password={form.password} />
            )}
          </div>

          <Input
            label="Confirm password"
            type="password"
            name="passwordConfirm"
            required
            autoComplete="new-password"
            placeholder="••••••••"
            leftIcon={<Lock className="h-4 w-4" />}
            disabled={loading}
            error={mismatch ? "Passwords do not match" : undefined}
            value={form.passwordConfirm}
            onChange={(e) =>
              setForm({ ...form, passwordConfirm: e.target.value })
            }
          />

          <Button
            type="submit"
            loading={loading}
            disabled={mismatch}
            fullWidth
            size="lg"
            className="shadow-lg shadow-emerald-600/20"
          >
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </form>
      </AuthCard>

      <AuthFooter
        text="Already have an account?"
        linkText="Log in →"
        href="/login"
      />
    </>
  );
}
