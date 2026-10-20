import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/format";

import { listMyTreks } from "../queries";
import { DIFFICULTIES } from "../schema";
import { TrekStatusBadge } from "./TrekStatus";

export async function TrekList() {
  const { treks } = await listMyTreks();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-semibold">Treks</h1>
        <Link href="/dashboard/treks/new" className={buttonVariants()}>
          New trek
        </Link>
      </div>

      {treks.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="font-medium">No treks yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your first trek, then create batches with dates and prices.
          </p>
        </div>
      ) : (
        <ul className="divide-y rounded-lg border">
          {treks.map((trek) => {
            // Batches come back in insertion order; dates as YYYY-MM-DD sort as text.
            const next = trek.batches
              .filter((b) => b.status === "open")
              .map((b) => b.start_date)
              .sort()[0];
            const difficulty = DIFFICULTIES.find((d) => d.value === trek.difficulty)?.label;
            return (
              <li key={trek.id}>
                <Link
                  href={`/dashboard/treks/${trek.id}`}
                  className="flex flex-col gap-1 p-4 hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{trek.name}</span>
                      <TrekStatusBadge status={trek.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {trek.region} · {trek.duration_days} days · {difficulty}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {trek.batches.length} {trek.batches.length === 1 ? "batch" : "batches"}
                    {next && ` · next ${formatDate(next)}`}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
