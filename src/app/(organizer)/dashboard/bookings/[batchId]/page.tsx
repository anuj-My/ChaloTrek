import type { Metadata } from "next";
import { Suspense } from "react";

import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { BatchBookings } from "@/features/bookings/components/BatchBookings";

export const metadata: Metadata = { title: "Batch bookings" };

export default function Page({ params }: PageProps<"/dashboard/bookings/[batchId]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <BatchBookings params={params} />
    </Suspense>
  );
}
