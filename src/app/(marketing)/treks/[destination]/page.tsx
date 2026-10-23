import type { Metadata } from "next";
import { Suspense } from "react";

import { DestinationPage } from "@/features/destinations/components/DestinationPage";
import { getDestination } from "@/features/destinations/queries";

export async function generateMetadata({ params }: PageProps<"/treks/[destination]">): Promise<Metadata> {
  const { destination: slug } = await params;
  const destination = await getDestination(slug);
  if (!destination) return { title: "Trek not found" };
  const title = `${destination.name} trek: compare organizers, prices and dates`;
  const description = `Compare ${destination.name} treks from verified organizers in ${destination.region}. See every upcoming batch, price and seats left, and book online.`;
  return { title, description, openGraph: { title, description } };
}

export default function Page({ params }: PageProps<"/treks/[destination]">) {
  return (
    <Suspense fallback={<div className="mx-auto h-96 max-w-6xl animate-pulse px-4 py-10" />}>
      <DestinationPage params={params} />
    </Suspense>
  );
}
