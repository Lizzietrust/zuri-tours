// app/tours/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { tourService } from "@/services/tours";
import TourDetailClient from "./TourDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tour = await tourService.getBySlugServer(slug);

  if (!tour) return { title: "Tour not found | Zuri Tours" };

  return {
    title: `${tour.name} | Zuri Tours`,
    description: tour.summary,
    openGraph: {
      title: tour.name,
      description: tour.summary,
      images: [`http://localhost:8000/img/tours/${tour.imageCover}`],
    },
  };
}

export default async function TourPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tour = await tourService.getBySlugServer(slug);

  if (!tour) notFound();

  return <TourDetailClient slug={slug} initialTour={tour} />;
}
