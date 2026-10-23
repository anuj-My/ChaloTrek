import type { Metadata } from "next";
import { Suspense } from "react";

import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { AdminBookings } from "@/features/bookings/components/AdminBookings";

export const metadata: Metadata = { title: "All bookings" };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AdminBookings />
    </Suspense>
  );
}
