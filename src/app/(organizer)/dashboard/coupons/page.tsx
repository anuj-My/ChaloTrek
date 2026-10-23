import type { Metadata } from "next";
import { Suspense } from "react";

import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { Coupons } from "@/features/coupons/components/Coupons";

export const metadata: Metadata = { title: "Coupons" };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Coupons />
    </Suspense>
  );
}
