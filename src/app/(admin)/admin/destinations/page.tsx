import type { Metadata } from "next";
import { Suspense } from "react";

import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { AdminDestinations } from "@/features/destinations/components/AdminDestinations";

export const metadata: Metadata = { title: "Destinations" };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AdminDestinations />
    </Suspense>
  );
}
