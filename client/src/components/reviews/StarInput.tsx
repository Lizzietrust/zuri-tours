"use client";

import { useState } from "react";

export default function StarInput({
  value,
  onChange,
  size = "md",
}: {
  value: number;
  onChange: (v: number) => void;
  size?: "sm" | "md" | "lg";
}) {
  const [hover, setHover] = useState<number | null>(null);
  const dim = size === "sm" ? "h-5 w-5" : size === "lg" ? "h-8 w-8" : "h-6 w-6";
  const display = hover ?? value;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(null)}
          className="cursor-pointer text-amber-500 transition hover:scale-110"
          aria-label={`${i} star${i > 1 ? "s" : ""}`}
        >
          <svg viewBox="0 0 24 24" className={dim} aria-hidden="true">
            <path
              fill={i <= display ? "currentColor" : "#e5e7eb"}
              d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"
            />
          </svg>
        </button>
      ))}
      <span className="ml-2 text-sm text-gray-500">
        {value ? `${value} / 5` : "Not rated"}
      </span>
    </div>
  );
}
