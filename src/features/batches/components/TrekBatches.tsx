import { ActionButton } from "@/components/shared/ActionButton";
import type { MyTrek } from "@/features/treks/queries";
import { formatDateRange, formatRupees } from "@/lib/format";

import { deleteBatch, setBatchStatus } from "../actions";
import { BatchForm } from "./BatchForm";
import { BatchStatusBadge } from "./BatchStatusBadge";

// Batches section of the trek editor: each batch with its actions, plus a
// form to add another.
export function TrekBatches({ trek }: { trek: MyTrek }) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="type-4">Batches</h2>
        <p className="text-sm text-muted-foreground">
          Each batch is one departure, with its own dates, price and seats.
        </p>
      </div>

      {trek.batches.length > 0 && (
        <ul className="space-y-3">
          {trek.batches.map((batch) => {
            const booked = batch.total_seats - (batch.seats_left ?? 0);
            return (
              <li key={batch.id} className="space-y-3 rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{formatDateRange(batch.start_date, batch.end_date)}</p>
                      <BatchStatusBadge status={batch.status} seatsLeft={batch.seats_left} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatRupees(batch.price_paise)} per person
                      {batch.deposit_paise && ` · ${formatRupees(batch.deposit_paise)} deposit`}
                      {` · ${batch.seats_left} of ${batch.total_seats} seats left`}
                      {booked > 0 && ` (${booked} booked)`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {batch.status === "open" && (
                      <ActionButton action={setBatchStatus} fields={{ batch_id: batch.id, status: "closed" }}>
                        Stop bookings
                      </ActionButton>
                    )}
                    {batch.status === "closed" && (
                      <ActionButton action={setBatchStatus} fields={{ batch_id: batch.id, status: "open" }}>
                        Reopen
                      </ActionButton>
                    )}
                    {batch.status !== "cancelled" && booked > 0 && (
                      <ActionButton
                        action={setBatchStatus}
                        fields={{ batch_id: batch.id, status: "cancelled" }}
                        confirm="Cancel this batch? People who booked will need refunds."
                      >
                        Cancel batch
                      </ActionButton>
                    )}
                    {booked === 0 && (
                      <ActionButton
                        action={deleteBatch}
                        fields={{ batch_id: batch.id }}
                        confirm="Delete this batch?"
                        variant="ghost"
                      >
                        Delete
                      </ActionButton>
                    )}
                  </div>
                </div>
                {batch.status !== "cancelled" && (
                  <details className="group">
                    <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                      Edit batch
                    </summary>
                    <div className="pt-4">
                      <BatchForm trekId={trek.id} durationDays={trek.duration_days} batch={batch} />
                    </div>
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="space-y-4 rounded-lg border border-dashed p-4">
        <h3 className="font-medium">Add a batch</h3>
        <BatchForm trekId={trek.id} durationDays={trek.duration_days} />
      </div>
    </section>
  );
}
