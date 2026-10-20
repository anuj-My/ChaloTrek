import type { Metadata } from "next";
import { Suspense } from "react";

import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { OrganizerBookings } from "@/features/bookings/components/OrganizerBookings";

export const metadata: Metadata = { title: "Bookings" };

export default function Page() {
  // Its own boundary, so navigating here from another dashboard page shows the
  // skeleton straight away instead of waiting on the old page.
  return (
    <Suspense fallback={<PageSkeleton />}>
      <OrganizerBookings />
    </Suspense>
  );
}
