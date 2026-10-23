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

// Paid now: the deposit per person when the batch takes one, else the full
// price. A coupon discount comes off the balance, so the deposit stays the
// same unless it's more than the discounted total.
export function amountDueNowPaise(
  batch: { price_paise: number; deposit_paise: number | null },
  people: number,
  discountPaise = 0,
) {
  const total = batch.price_paise * people - discountPaise;
  return batch.deposit_paise ? Math.min(batch.deposit_paise * people, total) : total;
}

type Coupon = { percent_off: number | null; amount_off_paise: number | null };

// What a coupon takes off. Matches coupon_discount() in the database: whole
// rupees, and always leaving at least ₹1 to pay.
export function couponDiscountPaise(coupon: Coupon, pricePaise: number, people: number) {
  const subtotal = pricePaise * people;
  const discount = coupon.percent_off
    ? Math.floor((subtotal * coupon.percent_off) / 10000) * 100
    : (coupon.amount_off_paise ?? 0) * people;
  return Math.min(discount, subtotal - 100);
}

// "CT-10001"
export function bookingReference(bookingNumber: number) {
  return `CT-${bookingNumber}`;
}
