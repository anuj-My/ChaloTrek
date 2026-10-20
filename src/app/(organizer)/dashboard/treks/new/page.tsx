import type { Metadata } from "next";
import { Suspense } from "react";

import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { NewTrek } from "@/features/treks/components/NewTrek";

export const metadata: Metadata = { title: "New trek" };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <NewTrek />
    </Suspense>
  );
}
