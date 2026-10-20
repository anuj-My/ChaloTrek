import Link from "next/link";

import { formatDateRange, formatRupees } from "@/lib/format";

import { listMyUpcomingBatches } from "../queries";
import { BatchStatusBadge } from "./BatchStatusBadge";

// All upcoming batches across the organizer's treks. Batches are added and
// edited on each trek's page.
export async function BatchList() {
  const batches = await listMyUpcomingBatches();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">Upcoming batches</h1>
        <p className="text-muted-foreground">To add or edit a batch, open its trek.</p>
      </div>

      {batches.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="font-medium">No upcoming batches</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Open a trek from <Link href="/dashboard/treks" className="underline underline-offset-4">Treks</Link> to add one.
          </p>
        </div>
      ) : (
        <ul className="divide-y rounded-lg border">
          {batches.map((batch) => (
            <li key={batch.id}>
              <Link
                href={`/dashboard/treks/${batch.treks.id}`}
                className="flex flex-col gap-1 p-4 hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{batch.treks.name}</span>
                    <BatchStatusBadge status={batch.status} seatsLeft={batch.seats_left} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDateRange(batch.start_date, batch.end_date)} · {formatRupees(batch.price_paise)}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {batch.seats_left} of {batch.total_seats} seats left
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
