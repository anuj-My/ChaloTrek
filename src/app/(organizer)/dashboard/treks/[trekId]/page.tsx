import type { Metadata } from "next";
import { Suspense } from "react";

import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { TrekEditor } from "@/features/treks/components/TrekEditor";

export const metadata: Metadata = { title: "Edit trek" };

export default function Page({ params }: PageProps<"/dashboard/treks/[trekId]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <TrekEditor params={params} />
    </Suspense>
  );
}
