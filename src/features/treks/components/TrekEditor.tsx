import Link from "next/link";

import { TrekBatches } from "@/features/batches/components/TrekBatches";

import { getMyTrek, listCancellationPolicies } from "../queries";
import { TrekForm } from "./TrekForm";
import { TrekPhotos } from "./TrekPhotos";
import { TrekStatusPanel } from "./TrekStatus";

export async function TrekEditor({ params }: { params: Promise<{ trekId: string }> }) {
  const { trekId } = await params;
  const [{ organizer, trek }, policies] = await Promise.all([getMyTrek(trekId), listCancellationPolicies()]);

  return (
    <div className="max-w-2xl space-y-8">
      <div className="space-y-1">
        <Link href="/dashboard/treks" className="text-sm text-muted-foreground hover:text-foreground">
          ← Treks
        </Link>
        <h1 className="font-heading text-2xl font-semibold">{trek.name}</h1>
        <p className="text-sm text-muted-foreground">
          chalotrek.in/o/{organizer.slug}/{trek.slug}
        </p>
      </div>

      <TrekStatusPanel trek={trek} organizer={organizer} />
      <TrekBatches trek={trek} />
      <TrekPhotos organizerId={organizer.id} trekId={trek.id} photos={trek.photos} />

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold">Trek details</h2>
        <TrekForm trek={trek} organizerSlug={organizer.slug} policies={policies} />
      </section>
    </div>
  );
}
