import { Suspense } from "react";

import { Hero } from "./sections/hero/Hero";
import { UpcomingTreks, UpcomingTreksSkeleton } from "./sections/upcoming-treks/UpcomingTreks";

export function Home() {
  return (
    <>
      <Hero />
      <Suspense fallback={<UpcomingTreksSkeleton />}>
        <UpcomingTreks />
      </Suspense>
    </>
  );
}
