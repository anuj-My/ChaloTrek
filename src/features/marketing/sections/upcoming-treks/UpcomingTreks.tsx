import Link from "next/link";

import { TrekCard } from "@/components/shared/TrekCard";
import { listUpcomingPublicTreks } from "@/features/treks/queries";

// Live treks with an open batch coming up, from every approved organizer.
// Reads the database at request time, so Home renders it inside <Suspense>.
export async function UpcomingTreks() {
  const treks = await listUpcomingPublicTreks(12);

  return (
    <section id="treks" className="mx-auto max-w-6xl scroll-mt-8 space-y-6 px-4 pb-24">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-heading text-2xl font-semibold">Upcoming treks</h2>
        <Link href="/treks" className="text-sm underline underline-offset-4">
          Explore all treks
        </Link>
      </div>
      {treks.length === 0 ? (
        <p className="text-muted-foreground">New batches are coming soon. Check back shortly.</p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {treks.map((trek) => (
            <li key={trek.id}>
              <TrekCard
                trek={trek}
                href={`/o/${trek.organizers.slug}/${trek.slug}`}
                organizerName={trek.organizers.name}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function UpcomingTreksSkeleton() {
  return (
    <section className="mx-auto max-w-6xl space-y-6 px-4 pb-24" aria-busy="true">
      <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="aspect-[4/3] animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </section>
  );
}
