import type { Metadata } from "next";
import { Suspense } from "react";

import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { BatchList } from "@/features/batches/components/BatchList";

export const metadata: Metadata = { title: "Batches" };

export default function Page() {
  // Its own boundary, so navigating here from another dashboard page shows the
  // skeleton straight away instead of waiting on the old page.
  return (
    <Suspense fallback={<PageSkeleton />}>
      <BatchList />
    </Suspense>
  );
}
