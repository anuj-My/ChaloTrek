import "server-only";

import { requireMyOrganizer } from "@/features/organizers/queries";
import { createClient } from "@/lib/supabase/server";

// The organizer's coupons with how often each was used: confirmed bookings,
// and bookings still holding seats (matches coupon_uses() in the database).
export async function listMyCoupons() {
  const organizer = await requireMyOrganizer();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coupons")
    .select("*, treks(name), bookings(status, hold_expires_at, discount_paise)")
    .eq("organizer_id", organizer.id)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const now = Date.now();
  return data.map(({ bookings, ...coupon }) => {
    const used = bookings.filter(
      (b) =>
        b.status === "confirmed" ||
        (b.status === "pending" && !!b.hold_expires_at && Date.parse(b.hold_expires_at) > now),
    );
    return { ...coupon, uses: used.length, discountGivenPaise: used.reduce((sum, b) => sum + b.discount_paise, 0) };
  });
}

export type MyCoupon = Awaited<ReturnType<typeof listMyCoupons>>[number];
