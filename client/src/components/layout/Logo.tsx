import Link from "next/link";
import { useId } from "react";

type LogoProps = {
  /** Show the "Zuri Tours" wordmark next to the mark */
  showText?: boolean;
  /** Mark size in px */
  size?: number;
  className?: string;
};

export function LogoMark({ size = 40 }: { size?: number }) {
  const gid = `logo-${useId().replace(/:/g, "")}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      className="shrink-0 drop-shadow-sm"
    >
      <defs>
        <linearGradient
          id={gid}
          x1="0"
          y1="0"
          x2="40"
          y2="40"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#10b981" />
          <stop offset="1" stopColor="#0284c7" />
        </linearGradient>
      </defs>

      {/* Tile */}
      <rect width="40" height="40" rx="11" fill={`url(#${gid})`} />
      <rect
        x="0.5"
        y="0.5"
        width="39"
        height="39"
        rx="10.5"
        stroke="white"
        strokeOpacity="0.25"
      />

      {/* Sun */}
      <circle cx="29.5" cy="12.5" r="3.5" fill="#fde68a" />

      {/* Mountains */}
      <path d="M5 31L16 14l6 9 4-5 9 13H5z" fill="white" fillOpacity="0.96" />

      {/* Snow cap */}
      <path
        d="M16 14l-3.3 5.3L15 18.2l1.2 1.6 1.4-1.6 1.7.9L16 14z"
        fill="#a7f3d0"
      />
    </svg>
  );
}

export default function Logo({
  showText = true,
  size = 40,
  className = "",
}: LogoProps) {
  return (
    <Link
      href="/"
      aria-label="Zuri Tours home"
      className={`group inline-flex items-center gap-2.5 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600 ${className}`}
    >
      <span className="transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">
        <LogoMark size={size} />
      </span>

      {showText && (
        <span className="flex flex-col leading-none">
          <span className="text-xl font-extrabold tracking-tight text-gray-900">
            Zuri{" "}
            <span className="bg-linear-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent">
              Tours
            </span>
          </span>
          <span className="mt-1 hidden text-[10px] font-semibold tracking-[0.2em] text-gray-400 uppercase sm:block">
            Explore · Discover
          </span>
        </span>
      )}
    </Link>
  );
}
