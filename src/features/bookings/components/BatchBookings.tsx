import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { formatDateRange, formatDateTime, formatRupees } from "@/lib/format";

import { getMyBatchBookings, type OrganizerBooking } from "../queries";
import { amountDueNowPaise, bookingReference } from "../status";
import { BookingStatusBadge } from "./BookingStatusBadge";
import { OfflinePaymentForm } from "./OfflinePaymentForm";

// One batch for the organizer: totals, everyone going, and each booking.
export async function BatchBookings({ params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  const batch = await getMyBatchBookings(batchId);
  const active = batch.activeBookings;
  const people = (status: string) =>
    active.filter((b) => b.displayStatus === status).reduce((sum, b) => sum + b.num_people, 0);
  const collected = active.filter((b) => b.displayStatus === "confirmed").reduce((sum, b) => sum + b.paid_paise, 0);
  const participants = active.flatMap((booking) => booking.participants.map((p) => ({ ...p, booking })));

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
          <h1 className="font-heading text-2xl font-semibold">{batch.treks.name}</h1>
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
            <dd className="mt-1 text-xl font-semibold">{stat.value}</dd>
          </div>
        ))}
      </dl>

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
            <h2 className="font-heading text-lg font-semibold">Participants ({participants.length})</h2>
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
                      <td className="p-3 whitespace-nowrap capitalize">
                        {p.age} · {p.gender}
                      </td>
                      <td className="p-3 whitespace-nowrap">{p.phone ?? "—"}</td>
                      <td className="p-3 whitespace-nowrap">
                        {p.emergency_contact_name}
                        <span className="block text-muted-foreground">{p.emergency_contact_phone}</span>
                      </td>
                      <td className="max-w-64 p-3 whitespace-pre-line">{p.medical_notes ?? "—"}</td>
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
            <h2 className="font-heading text-lg font-semibold">Bookings ({active.length})</h2>
            <BookingList bookings={active} batch={batch} />
          </section>
        </>
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
            </p>
            {booking.paid_paise > 0 && (
              <p>
                {formatRupees(booking.paid_paise)} paid{booking.paid_offline && " (UPI/cash)"}
                {booking.paid_paise < booking.total_paise &&
                  ` · ${formatRupees(booking.total_paise - booking.paid_paise)} due`}
              </p>
            )}
            <p>Booked {formatDateTime(booking.created_at)}</p>
            {canRecordPayment(booking, batch) && (
              <div className="pt-2 sm:flex sm:justify-end">
                <OfflinePaymentForm
                  bookingId={booking.id}
                  totalPaise={booking.total_paise}
                  confirmed={booking.displayStatus === "confirmed"}
                  suggestedPaise={
                    booking.displayStatus === "confirmed"
                      ? booking.paid_paise
                      : amountDueNowPaise(batch, booking.num_people)
                  }
                />
              </div>
            )}
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
