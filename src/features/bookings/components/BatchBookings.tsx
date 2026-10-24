import Link from "next/link";

import { ActionButton } from "@/components/shared/ActionButton";
import { buttonVariants } from "@/components/ui/button";
import { formatDateRange, formatDateTime, formatRupees } from "@/lib/format";

import { cancelBooking, removeWaitlistEntry } from "../actions";
import { getMyBatchBookings, type OrganizerBooking } from "../queries";
import { amountDueNowPaise, bookingReference } from "../status";
import { BookingStatusBadge } from "./BookingStatusBadge";
import { GroupLinkForm } from "./GroupLinkForm";
import { OfflinePaymentForm } from "./OfflinePaymentForm";
import { PaymentProofReview } from "./PaymentProofReview";

// One batch for the organizer: totals, everyone going, and each booking.
export async function BatchBookings({ params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  const batch = await getMyBatchBookings(batchId);
  const active = batch.activeBookings;
  const people = (status: string) =>
    active.filter((b) => b.displayStatus === status).reduce((sum, b) => sum + b.num_people, 0);
  const collected = active.filter((b) => b.displayStatus === "confirmed").reduce((sum, b) => sum + b.paid_paise, 0);
  const participants = active.flatMap((booking) => booking.participants.map((p) => ({ ...p, booking })));
  const toCheck = active.filter((b) => b.proofToCheck).length;
  const missingDetails = participants.filter((p) => p.age === null).length;

  const stats = [
    { label: "Confirmed", value: people("confirmed") },
    { label: "Awaiting payment", value: people("held") },
    { label: "Seats left", value: `${batch.seats_left ?? 0} of ${batch.total_seats}` },
    { label: "Collected", value: formatRupees(collected) },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <Link href="/dashboard/bookings" className="text-sm text-muted-foreground hover:text-foreground">
            ← Bookings
          </Link>
          <h1 className="type-2">{batch.treks.name}</h1>
          <p className="text-muted-foreground">
            {formatDateRange(batch.start_date, batch.end_date)}
            {batch.status !== "open" && ` · ${batch.status === "closed" ? "Closed" : "Cancelled"}`}
          </p>
        </div>
        {participants.length > 0 && (
          // A plain link: the export is a file download, not a page.
          <a href={`/dashboard/bookings/${batch.id}/export`} className={buttonVariants({ variant: "outline" })}>
            Download participant list
          </a>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border p-4">
            <dt className="text-sm text-muted-foreground">{stat.label}</dt>
            <dd className="mt-1 font-heading text-2xl tabular-nums">{stat.value}</dd>
          </div>
        ))}
      </dl>

      {toCheck > 0 && (
        <p className="rounded-lg border border-primary/40 bg-primary/5 p-4 text-sm">
          <span className="font-medium">
            {toCheck} UPI {toCheck === 1 ? "payment" : "payments"} to check.
          </span>{" "}
          Find each transaction ID in your bank or UPI app, then accept it below to confirm the booking.
        </p>
      )}

      <GroupLinkForm batchId={batch.id} url={batch.batch_group_links?.url ?? null} />

      {active.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="font-medium">No bookings yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Share the trek&apos;s booking link on Instagram to get your first one.
          </p>
        </div>
      ) : (
        <>
          <section className="space-y-3">
            <div>
              <h2 className="type-4">Participants ({participants.length})</h2>
              {missingDetails > 0 && (
                <p className="text-sm text-muted-foreground">
                  {participants.length - missingDetails} of {participants.length} have filled in their details. The
                  rest were sent a link by the person who booked; remind them on the booking&apos;s phone number.
                </p>
              )}
            </div>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-muted-foreground">
                  <tr>
                    <th className="p-3 font-medium">Name</th>
                    <th className="p-3 font-medium">Age</th>
                    <th className="p-3 font-medium">Phone</th>
                    <th className="p-3 font-medium">Emergency contact</th>
                    <th className="p-3 font-medium">Medical notes</th>
                    <th className="p-3 font-medium">Booking</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {participants.map((p) => (
                    <tr key={p.id} className="align-top">
                      <td className="p-3 font-medium whitespace-nowrap">{p.full_name}</td>
                      {p.age === null ? (
                        <>
                          <td className="p-3 whitespace-nowrap text-muted-foreground">Waiting for details</td>
                          <td className="p-3 whitespace-nowrap">{p.phone ?? "—"}</td>
                          <td colSpan={2} className="p-3" />
                        </>
                      ) : (
                        <>
                          <td className="p-3 whitespace-nowrap capitalize">
                            {p.age} · {p.gender}
                          </td>
                          <td className="p-3 whitespace-nowrap">{p.phone ?? "—"}</td>
                          <td className="p-3 whitespace-nowrap">
                            {p.emergency_contact_name}
                            <span className="block text-muted-foreground">{p.emergency_contact_phone}</span>
                          </td>
                          <td className="max-w-64 p-3 whitespace-pre-line">{p.medical_notes ?? "—"}</td>
                        </>
                      )}
                      <td className="p-3 whitespace-nowrap text-muted-foreground">
                        {bookingReference(p.booking.booking_number)}
                        {p.booking.displayStatus === "held" && <span className="block">Awaiting payment</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="type-4">Bookings ({active.length})</h2>
            <BookingList bookings={active} batch={batch} />
          </section>
        </>
      )}

      {batch.waitlist_entries.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="type-4">
              Waitlist ({batch.waitlist_entries.reduce((sum, e) => sum + e.num_people, 0)} people)
            </h2>
            <p className="text-sm text-muted-foreground">
              When seats free up, everyone whose group fits is emailed. Seats go to whoever books first. A long waitlist
              may mean it&apos;s worth adding seats or another batch.
            </p>
          </div>
          <ul className="divide-y rounded-lg border">
            {batch.waitlist_entries.map((entry) => (
              <li key={entry.id} className="flex flex-col gap-2 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="font-medium">{entry.email}</p>
                  <p className="text-muted-foreground">
                    {entry.num_people} {entry.num_people === 1 ? "person" : "people"} · joined{" "}
                    {formatDateTime(entry.created_at)}
                    {entry.notified_at && ` · emailed ${formatDateTime(entry.notified_at)}`}
                  </p>
                </div>
                <ActionButton
                  action={removeWaitlistEntry}
                  fields={{ entry_id: entry.id }}
                  variant="ghost"
                  confirm={`Remove ${entry.email} from the waitlist?`}
                >
                  Remove
                </ActionButton>
              </li>
            ))}
          </ul>
        </section>
      )}

      {batch.otherBookings.length > 0 && (
        <details className="space-y-3">
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
            Not completed or cancelled ({batch.otherBookings.length})
          </summary>
          <p className="py-2 text-sm text-muted-foreground">
            These didn&apos;t finish payment, so they don&apos;t hold seats. If someone messages you a booking ID and
            pays you directly, find it here and mark it as paid.
          </p>
          <BookingList bookings={batch.otherBookings} batch={batch} />
        </details>
      )}
    </div>
  );
}

type BatchPrices = { price_paise: number; deposit_paise: number | null; status: string };

function BookingList({ bookings, batch }: { bookings: OrganizerBooking[]; batch: BatchPrices }) {
  return (
    <ul className="divide-y rounded-lg border">
      {bookings.map((booking) => (
        <li key={booking.id} className="flex flex-col gap-2 p-4 text-sm sm:flex-row sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{bookingReference(booking.booking_number)}</span>
              <BookingStatusBadge status={booking.displayStatus} />
            </div>
            <p className="text-muted-foreground">
              {booking.participants.map((p) => p.full_name).join(", ")}
            </p>
            <p className="text-muted-foreground">
              {booking.contact_phone} · {booking.contact_email}
            </p>
          </div>
          <div className="text-muted-foreground sm:text-right">
            <p>
              {booking.num_people} {booking.num_people === 1 ? "person" : "people"} ·{" "}
              {formatRupees(booking.total_paise)}
              {booking.coupons && ` · ${booking.coupons.code} −${formatRupees(booking.discount_paise)}`}
            </p>
            {booking.paid_paise > 0 && (
              <p>
                {formatRupees(booking.paid_paise)} paid{booking.paid_offline && " (UPI/cash)"}
                {booking.paid_paise < booking.total_paise &&
                  booking.displayStatus === "confirmed" &&
                  ` · ${formatRupees(booking.total_paise - booking.paid_paise)} due`}
              </p>
            )}
            <p>Booked {formatDateTime(booking.created_at)}</p>
            {booking.cancelled_at && (
              <p>
                Cancelled {booking.cancelled_by === "trekker" ? "by the trekker" : "by you"}{" "}
                {formatDateTime(booking.cancelled_at)}
              </p>
            )}
            {booking.proofToCheck && (
              <div className="pt-2">
                <PaymentProofReview
                  proof={booking.proofToCheck}
                  reference={bookingReference(booking.booking_number)}
                />
              </div>
            )}
            <div className="flex flex-wrap items-start gap-2 pt-2 sm:justify-end">
              {canRecordPayment(booking, batch) && (
                <OfflinePaymentForm
                  bookingId={booking.id}
                  totalPaise={booking.total_paise}
                  confirmed={booking.displayStatus === "confirmed"}
                  suggestedPaise={
                    booking.displayStatus === "confirmed"
                      ? booking.paid_paise
                      : amountDueNowPaise(batch, booking.num_people, booking.discount_paise)
                  }
                />
              )}
              {(booking.displayStatus === "held" || booking.displayStatus === "confirmed") && (
                <ActionButton
                  action={cancelBooking}
                  fields={{ booking_id: booking.id }}
                  variant="ghost"
                  confirm={cancelPrompt(booking)}
                >
                  Cancel booking
                </ActionButton>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

// Payments can be recorded on any booking that isn't cancelled or refunded,
// unless the batch itself was cancelled.
function canRecordPayment(booking: OrganizerBooking, batch: BatchPrices) {
  return batch.status !== "cancelled" && ["held", "expired", "confirmed"].includes(booking.displayStatus);
}

function cancelPrompt(booking: OrganizerBooking) {
  const ref = bookingReference(booking.booking_number);
  const refund = booking.paid_paise > 0 ? ` Refund the ${formatRupees(booking.paid_paise)} they paid yourself.` : "";
  return `Cancel ${ref}? Its seats go back on sale.${refund}`;
}
