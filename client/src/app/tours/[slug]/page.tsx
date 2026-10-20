import type { Metadata } from "next";
import { tourService } from "@/services/tours";
import TourDetailClient from "./TourDetailClient";

const API_ORIGIN = process.env.NEXT_PUBLIC_API_ORIGIN;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  let tour = null;
  try {
    tour = await tourService.getBySlugServer(slug);
  } catch {
    tour = null;
  }

  if (!tour) {
    return {
      title: "Tour not found | Zuri Tours",
      description: "The tour you're looking for doesn't exist.",
    };
  }

  const cover = tour.imageCover?.startsWith("http")
    ? tour.imageCover
    : `${API_ORIGIN}/img/tours/${tour.imageCover}`;

  return {
    title: `${tour.name} | Zuri Tours`,
    description: tour.summary,
    openGraph: {
      title: tour.name,
      description: tour.summary,
      images: [{ url: cover, width: 1200, height: 630, alt: tour.name }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: tour.name,
      description: tour.summary,
      images: [cover],
    },
  };
}

export default async function TourPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <TourDetailClient slug={slug} />;
}
