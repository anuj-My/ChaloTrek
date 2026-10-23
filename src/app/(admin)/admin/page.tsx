import type { Metadata } from "next";
import { Suspense } from "react";

import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { AdminOverview } from "@/features/bookings/components/AdminOverview";

export const metadata: Metadata = { title: "Admin" };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AdminOverview />
    </Suspense>
  );
}
