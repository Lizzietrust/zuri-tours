import type { Metadata } from "next";
import { tourService } from "@/services/tours";
import TourDetailClient from "./TourDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tour = await tourService.getBySlugServer(slug);

  if (!tour) return { title: "Zuri Tours" };

  return {
    title: `${tour.name} | Zuri Tours`,
    description: tour.summary,
    openGraph: {
      title: tour.name,
      description: tour.summary,
      images: [
        `${process.env.NEXT_PUBLIC_API_ORIGIN || "http://localhost:8000"}/img/tours/${tour.imageCover}`,
      ],
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
