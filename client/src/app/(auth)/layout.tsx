import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-linear-to-br from-emerald-50 via-white to-emerald-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand */}
        <Link
          href="/"
          className="mb-6 flex items-center justify-center gap-2 text-lg font-bold text-emerald-700 hover:opacity-80"
        >
          <span className="text-2xl">🏔️</span>
          <span>Zuri Tours</span>
        </Link>

        {children}

        <p className="mt-8 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Zuri Tours
        </p>
      </div>
    </div>
  );
}
