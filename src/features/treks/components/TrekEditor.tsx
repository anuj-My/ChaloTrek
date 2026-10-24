import Link from "next/link";

import { TrekBatches } from "@/features/batches/components/TrekBatches";
import { listDestinations } from "@/features/destinations/queries";

import { getMyTrek, listCancellationPolicies } from "../queries";
import { TrekForm } from "./TrekForm";
import { TrekPhotos } from "./TrekPhotos";
import { TrekStatusPanel } from "./TrekStatus";

export async function TrekEditor({ params }: { params: Promise<{ trekId: string }> }) {
  const { trekId } = await params;
  const [{ organizer, trek }, policies, destinations] = await Promise.all([
    getMyTrek(trekId),
    listCancellationPolicies(),
    listDestinations(),
  ]);

  return (
    <div className="max-w-2xl space-y-8">
      <div className="space-y-1">
        <Link href="/dashboard/treks" className="text-sm text-muted-foreground hover:text-foreground">
          ← Treks
        </Link>
        <h1 className="type-2">{trek.name}</h1>
        <Link
          href={`/o/${organizer.slug}/${trek.slug}`}
          target="_blank"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          chalotrek.in/o/{organizer.slug}/{trek.slug}
        </Link>
      </div>

      <TrekStatusPanel trek={trek} organizer={organizer} />
      <TrekBatches trek={trek} />
      <TrekPhotos organizerId={organizer.id} trekId={trek.id} photos={trek.photos} />

      <section className="space-y-4">
        <h2 className="type-4">Trek details</h2>
        <TrekForm trek={trek} organizerSlug={organizer.slug} policies={policies} destinations={destinations} />
      </section>
    </div>
  );
}
