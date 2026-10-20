import type { Metadata } from "next";
import { Suspense } from "react";

import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { OrganizerReview } from "@/features/organizers/components/OrganizerReview";

export const metadata: Metadata = { title: "Organizers" };

export default function Page() {
  // Its own boundary, so navigating here from another dashboard page shows the
  // skeleton straight away instead of waiting on the old page.
  return (
    <Suspense fallback={<PageSkeleton />}>
      <OrganizerReview />
    </Suspense>
  );
}
