import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-[80vh] items-center justify-center overflow-hidden bg-linear-to-br from-emerald-50 via-white to-sky-50 px-6 py-12 sm:py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-emerald-200/40 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-sky-200/40 blur-3xl"
      />

      <div className="relative w-full max-w-md">{children}</div>
    </div>
  );
}
