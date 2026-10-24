import type { Metadata } from "next";
import { Suspense } from "react";

import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { SourceInsights } from "@/features/insights/components/SourceInsights";

export const metadata: Metadata = { title: "Insights" };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SourceInsights />
    </Suspense>
  );
}
