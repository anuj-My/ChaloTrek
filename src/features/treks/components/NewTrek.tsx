import Link from "next/link";

import { listDestinations } from "@/features/destinations/queries";
import { requireMyOrganizer } from "@/features/organizers/queries";

import { listCancellationPolicies } from "../queries";
import { TrekForm } from "./TrekForm";

export async function NewTrek() {
  const [organizer, policies, destinations] = await Promise.all([
    requireMyOrganizer(),
    listCancellationPolicies(),
    listDestinations(),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="space-y-1">
        <Link href="/dashboard/treks" className="text-sm text-muted-foreground hover:text-foreground">
          ← Treks
        </Link>
        <h1 className="font-heading text-2xl font-semibold">New trek</h1>
        <p className="text-muted-foreground">It stays a draft until you publish it. Add batches after saving.</p>
      </div>
      <TrekForm organizerSlug={organizer.slug} policies={policies} destinations={destinations} />
    </div>
  );
}
