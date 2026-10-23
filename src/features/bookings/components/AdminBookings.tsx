import Link from "next/link";

import { formatDateRange, formatDateTime, formatRupees } from "@/lib/format";

import { listAllBookings } from "../queries";
import { bookingReference } from "../status";
import { BookingStatusBadge } from "./BookingStatusBadge";

const LIMIT = 200;

// Admin: the latest bookings on the platform, for support questions.
export async function AdminBookings() {
  const bookings = await listAllBookings(LIMIT);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">All bookings</h1>
        <p className="text-muted-foreground">
          {bookings.length === LIMIT ? `The latest ${LIMIT} bookings.` : `${bookings.length} bookings.`} Search with
          your browser (Ctrl+F) by booking ID, email or phone.
        </p>
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="font-medium">No bookings yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="p-3 font-medium">Booking</th>
                <th className="p-3 font-medium">Trek</th>
                <th className="p-3 font-medium">Trekker</th>
                <th className="p-3 font-medium">Amount</th>
                <th className="p-3 font-medium">Booked</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {bookings.map((booking) => {
                const batch = booking.batches;
                const trek = batch.treks;
                return (
                  <tr key={booking.id} className="align-top">
                    <td className="space-y-1 p-3 whitespace-nowrap">
                      <p className="font-medium">{bookingReference(booking.booking_number)}</p>
                      <BookingStatusBadge status={booking.displayStatus} />
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/o/${trek.organizers.slug}/${trek.slug}`}
                        className="font-medium underline-offset-4 hover:underline"
                      >
                        {trek.name}
                      </Link>
                      <p className="text-muted-foreground">
                        {trek.organizers.name} · {formatDateRange(batch.start_date, batch.end_date)}
                      </p>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {booking.contact_email}
                      <p className="text-muted-foreground">{booking.contact_phone}</p>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {formatRupees(booking.total_paise)}
                      <p className="text-muted-foreground">
                        {booking.num_people} {booking.num_people === 1 ? "person" : "people"}
                        {booking.paid_paise > 0 &&
                          ` · ${formatRupees(booking.paid_paise)} paid${booking.paid_offline ? " (UPI/cash)" : ""}`}
                      </p>
                    </td>
                    <td className="p-3 whitespace-nowrap text-muted-foreground">
                      {formatDateTime(booking.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
