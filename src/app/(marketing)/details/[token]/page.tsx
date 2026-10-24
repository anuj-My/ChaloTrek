import type { Metadata } from "next";
import { Suspense } from "react";

import { ParticipantDetailsPage } from "@/features/bookings/components/ParticipantDetailsPage";

// Private links, so keep them out of search engines.
export const metadata: Metadata = { title: "Your trek details", robots: { index: false, follow: false } };

export default function Page({ params }: PageProps<"/details/[token]">) {
  return (
    <Suspense fallback={<div className="mx-auto h-96 max-w-xl animate-pulse px-4 py-12" />}>
      <ParticipantDetailsPage params={params} />
    </Suspense>
  );
}
