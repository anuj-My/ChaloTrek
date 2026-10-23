import type { Metadata } from "next";
import { Suspense } from "react";

import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { AdminReviews } from "@/features/reviews/components/AdminReviews";

export const metadata: Metadata = { title: "Reviews" };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AdminReviews />
    </Suspense>
  );
}
