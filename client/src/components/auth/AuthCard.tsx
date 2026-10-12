import type { ReactNode } from "react";

export default function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-5 rounded-3xl border border-gray-200 bg-white/90 p-6 shadow-xl shadow-emerald-900/5 backdrop-blur sm:p-8">
      {children}
    </div>
  );
}
