import Link from "next/link";

import { formatDateRange, formatRupees, todayInIndia } from "@/lib/format";

import { listMyBookings } from "../queries";
import { bookingReference } from "../status";
import { BookingStatusBadge } from "./BookingStatusBadge";

export async function MyBookings() {
  const bookings = await listMyBookings();
  const today = todayInIndia();

  return (
    <div className="space-y-6">
      <h1 className="type-2">My bookings</h1>

      {bookings.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="font-medium">No bookings yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            When you book a trek, it shows up here.
          </p>
        </div>
      ) : (
        <ul className="divide-y rounded-lg border">
          {bookings.map((booking) => {
            const batch = booking.batches;
            const canReview = booking.displayStatus === "confirmed" && batch.end_date < today && !booking.reviews;
            return (
              <li key={booking.id}>
                <Link
                  href={`/my-bookings/${booking.id}`}
                  className="flex flex-col gap-1 p-4 hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{batch.treks.name}</span>
                      <BookingStatusBadge status={booking.displayStatus} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDateRange(batch.start_date, batch.end_date)} · by {batch.treks.organizers.name}
                    </p>
                    {canReview && <p className="text-sm font-medium text-foreground">How was it? Leave a review →</p>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {bookingReference(booking.booking_number)} · {booking.num_people}{" "}
                    {booking.num_people === 1 ? "person" : "people"} · {formatRupees(booking.total_paise)}
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
