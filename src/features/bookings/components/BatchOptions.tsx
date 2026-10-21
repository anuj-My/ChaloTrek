import { Badge } from "@/components/ui/badge";
import type { PublicTrek } from "@/features/treks/queries";
import { formatDateRange, formatRupees } from "@/lib/format";

type Props = { batches: PublicTrek["batches"]; instagramHandle: string | null };

// Upcoming batches with price and live seats. Online booking comes next; until
// then trekkers are pointed to the organizer.
export function BatchOptions({ batches, instagramHandle }: Props) {
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
              <li key={batch.id} className="space-y-1 py-3 first:pt-0 last:pb-0">
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
              </li>
            );
          })}
        </ul>
      )}

      <p className="border-t pt-4 text-sm text-muted-foreground">
        Online booking is coming soon.
        {instagramHandle && (
          <>
            {" "}
            To book now, message{" "}
            <a
              href={`https://ig.me/m/${instagramHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline underline-offset-4"
            >
              @{instagramHandle}
            </a>{" "}
            on Instagram.
          </>
        )}
      </p>
    </section>
  );
}
