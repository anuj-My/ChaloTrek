import type { Metadata } from "next";
import { Suspense } from "react";

import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { TrekList } from "@/features/treks/components/TrekList";

export const metadata: Metadata = { title: "Treks" };

export default function Page() {
  // Its own boundary, so navigating here from another dashboard page shows the
  // skeleton straight away instead of waiting on the old page.
  return (
    <Suspense fallback={<PageSkeleton />}>
      <TrekList />
    </Suspense>
  );
}
