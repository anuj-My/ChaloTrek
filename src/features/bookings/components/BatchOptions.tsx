import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { PublicTrek } from "@/features/treks/queries";
import { formatDateRange, formatRupees } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = { batches: PublicTrek["batches"]; trekPath: string };

// Upcoming batches with price, live seats and a Book button for each open one.
export function BatchOptions({ batches, trekPath }: Props) {
  return (
    <section className="space-y-4 rounded-xl border p-5">
      <h2 className="font-heading text-xl font-semibold">Upcoming batches</h2>

      {batches.length === 0 ? (
        <p className="text-sm text-muted-foreground">No upcoming batches right now. Check back soon.</p>
      ) : (
        <ul className="divide-y">
          {batches.map((batch) => {
            const seats = batch.seats_left ?? 0;
            const bookable = batch.status === "open" && seats > 0;
            return (
              <li key={batch.id} className="space-y-3 py-4 first:pt-0 last:pb-0">
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{formatDateRange(batch.start_date, batch.end_date)}</p>
                    {!bookable && <Badge variant="secondary">{batch.status === "closed" ? "Closed" : "Full"}</Badge>}
                  </div>
                  <p className="text-sm">
                    <span className="font-medium">{formatRupees(batch.price_paise)}</span>
                    <span className="text-muted-foreground"> per person</span>
                  </p>
                  {bookable && (
                    <p className="text-sm text-muted-foreground">
                      {batch.deposit_paise && `${formatRupees(batch.deposit_paise)} to book · `}
                      <span className={seats <= 5 ? "font-medium text-destructive" : undefined}>
                        {seats <= 5 ? `Only ${seats} ${seats === 1 ? "seat" : "seats"} left` : `${seats} seats left`}
                      </span>
                    </p>
                  )}
                </div>
                {bookable && (
                  <Link href={`${trekPath}/book/${batch.id}`} className={cn(buttonVariants({ size: "lg" }), "w-full")}>
                    Book this batch
                  </Link>
                )}
                {batch.status === "open" && seats === 0 && (
                  <Link href={`${trekPath}/book/${batch.id}`} className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
                    Join the waitlist
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
