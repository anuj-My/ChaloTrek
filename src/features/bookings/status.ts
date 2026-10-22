// What a booking's status means to the trekker. A pending booking whose seat
// hold has run out stays "pending" in the database, but it no longer holds
// seats, so it's shown as expired.

type BookingLike = {
  status: "pending" | "confirmed" | "cancelled" | "expired" | "refunded";
  hold_expires_at: string | null;
};

export type BookingDisplayStatus = "held" | "confirmed" | "cancelled" | "expired" | "refunded";

export function bookingDisplayStatus(booking: BookingLike, now: number): BookingDisplayStatus {
  if (booking.status !== "pending") return booking.status;
  const holdEnds = booking.hold_expires_at ? Date.parse(booking.hold_expires_at) : 0;
  return holdEnds > now ? "held" : "expired";
}

export const BOOKING_STATUS_LABELS: Record<BookingDisplayStatus, string> = {
  held: "Awaiting payment",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  expired: "Not completed",
  refunded: "Refunded",
};

// Paid now: the deposit per person when the batch takes one, else the full price.
export function amountDueNowPaise(batch: { price_paise: number; deposit_paise: number | null }, people: number) {
  return (batch.deposit_paise ?? batch.price_paise) * people;
}

// "CT-10001"
export function bookingReference(bookingNumber: number) {
  return `CT-${bookingNumber}`;
}
