import type { Metadata } from "next";
import { Suspense } from "react";

import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { OrganizerSettings } from "@/features/organizers/components/OrganizerSettings";

export const metadata: Metadata = { title: "Settings" };

export default function Page() {
  // Its own boundary, so navigating here from another dashboard page shows the
  // skeleton straight away instead of waiting on the old page.
  return (
    <Suspense fallback={<PageSkeleton />}>
      <OrganizerSettings />
    </Suspense>
  );
}
