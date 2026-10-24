import Link from "next/link";

import { formatDateRange, formatRupees } from "@/lib/format";

import { type BatchBookingSummary, listMyBatchBookingSummaries } from "../queries";

// Every batch with how many people are booked; each opens its participant list.
export async function OrganizerBookings() {
  const { upcoming, past } = await listMyBatchBookingSummaries();

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="type-2">Bookings</h1>
        <p className="text-muted-foreground">Open a batch to see who&apos;s going and download the list.</p>
      </div>

      {upcoming.length === 0 && past.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="font-medium">No batches yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add batches to a trek from{" "}
            <Link href="/dashboard/treks" className="underline underline-offset-4">
              Treks
            </Link>
            . Bookings show up here.
          </p>
        </div>
      ) : (
        <>
          <BatchSummaryList title="Upcoming" batches={upcoming} empty="No upcoming batches." />
          {past.length > 0 && <BatchSummaryList title="Past" batches={past} />}
        </>
      )}
    </div>
  );
}

function BatchSummaryList({ title, batches, empty }: { title: string; batches: BatchBookingSummary[]; empty?: string }) {
  return (
    <section className="space-y-3">
      <h2 className="type-4">{title}</h2>
      {batches.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {batches.map((batch) => (
            <li key={batch.id}>
              <Link
                href={`/dashboard/bookings/${batch.id}`}
                className="flex flex-col gap-1 p-4 hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <p className="font-medium">
                    {batch.treks.name}
                    {batch.status === "cancelled" && <span className="text-muted-foreground"> · Cancelled</span>}
                  </p>
                  <p className="text-sm text-muted-foreground">{formatDateRange(batch.start_date, batch.end_date)}</p>
                </div>
                <div className="text-sm text-muted-foreground sm:text-right">
                  <p>
                    <span className="font-medium text-foreground">{batch.confirmedPeople}</span> confirmed
                    {batch.heldPeople > 0 && ` · ${batch.heldPeople} awaiting payment`} · {batch.seats_left ?? 0} of{" "}
                    {batch.total_seats} seats left
                  </p>
                  {batch.collectedPaise > 0 && <p>{formatRupees(batch.collectedPaise)} collected</p>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
