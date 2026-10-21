import type { Metadata } from "next";

import { BookingPage } from "@/features/bookings/components/BookingPage";
import { getPublicTrek } from "@/features/treks/queries";

export async function generateMetadata({ params }: PageProps<"/o/[organizer]/[trek]">): Promise<Metadata> {
  const { organizer, trek: trekSlug } = await params;
  const trek = await getPublicTrek(organizer, trekSlug);
  if (!trek) return { title: "Trek not found" };
  const title = `${trek.name} by ${trek.organizers.name}`;
  const description = trek.summary ?? `${trek.duration_days}-day trek in ${trek.region}. See batches and prices.`;
  return {
    title,
    description,
    openGraph: { title, description, images: trek.photos.slice(0, 1) },
  };
}

export default function Page({ params }: PageProps<"/o/[organizer]/[trek]">) {
  return <BookingPage params={params} />;
}
