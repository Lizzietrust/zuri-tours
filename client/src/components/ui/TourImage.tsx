"use client";

import Image from "next/image";
import { useState } from "react";
import { imageUrl } from "@/services/tours";

type Props = {
  src?: string | null;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
};

/**
 * next/image with a graceful fallback when the source 404s or is missing.
 * Use inside a `relative` container with explicit dimensions (like `fill`).
 */
export default function TourImage({
  src,
  alt,
  sizes = "(max-width: 640px) 100vw, 128px",
  priority = false,
  className = "object-cover",
}: Props) {
  const [failed, setFailed] = useState(false);

  const resolved = failed ? "/placeholder-tour.jpg" : imageUrl(src);

  return (
    <Image
      src={resolved}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
      onError={() => setFailed(true)}
      unoptimized={process.env.NODE_ENV === "development"}
    />
  );
}
