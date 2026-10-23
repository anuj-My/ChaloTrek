import type { Metadata } from "next";
import { Suspense } from "react";

import { ExploreTreks } from "@/features/treks/components/ExploreTreks";

export const metadata: Metadata = {
  title: "Explore treks",
  description:
    "Compare Himalayan treks from verified organizers in Uttarakhand, Himachal and beyond. Real dates, prices and seats left.",
};

export default function Page({ searchParams }: PageProps<"/treks">) {
  return (
    <Suspense fallback={<div className="mx-auto h-96 max-w-6xl animate-pulse px-4 py-10" />}>
      <ExploreTreks searchParams={searchParams} />
    </Suspense>
  );
}
