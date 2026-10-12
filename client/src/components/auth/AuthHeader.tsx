import Link from "next/link";
import { LogoMark } from "@/components/layout/Logo";

export default function AuthHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8 text-center">
      <Link
        href="/"
        aria-label="Zuri Tours home"
        className="mx-auto mb-5 inline-flex rounded-2xl shadow-lg shadow-emerald-600/20 transition-transform duration-300 hover:scale-105 hover:-rotate-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600"
      >
        <LogoMark size={52} />
      </Link>

      <h1 className="text-3xl font-extrabold tracking-tight text-balance text-gray-900 sm:text-4xl">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 text-sm text-pretty text-gray-600">{subtitle}</p>
      )}
    </div>
  );
}
