import { ActionButton } from "@/components/shared/ActionButton";
import { Badge } from "@/components/ui/badge";
import { listMyTreks } from "@/features/treks/queries";
import { formatDate, formatRupees, todayInIndia } from "@/lib/format";

import { deleteCoupon, setCouponActive } from "../actions";
import { listMyCoupons, type MyCoupon } from "../queries";
import { CouponForm } from "./CouponForm";

// The organizer's coupon codes: add one, see how each is doing, pause or delete.
export async function Coupons() {
  const [coupons, { treks }] = await Promise.all([listMyCoupons(), listMyTreks()]);
  const today = todayInIndia();

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">Coupons</h1>
        <p className="text-muted-foreground">
          Share a code in your Instagram posts or stories. Trekkers enter it when booking, and the discount comes off
          the balance, so the deposit stays the same.
        </p>
      </div>

      <section className="space-y-4 rounded-xl border p-5">
        <h2 className="font-heading text-lg font-semibold">New coupon</h2>
        <CouponForm treks={treks.map(({ id, name }) => ({ id, name }))} />
      </section>

      {coupons.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">Your coupons</h2>
          <ul className="divide-y rounded-lg border">
            {coupons.map((coupon) => (
              <li
                key={coupon.id}
                className="flex flex-col gap-3 p-4 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-medium">{coupon.code}</span>
                    <CouponStatus coupon={coupon} today={today} />
                  </div>
                  <p className="text-muted-foreground">
                    {coupon.percent_off
                      ? `${coupon.percent_off}% off`
                      : `${formatRupees(coupon.amount_off_paise ?? 0)} off per person`}
                    {" · "}
                    {coupon.treks?.name ?? "All treks"}
                    {coupon.valid_until && ` · until ${formatDate(coupon.valid_until)}`}
                  </p>
                  <p className="text-muted-foreground">
                    Used {coupon.uses}
                    {coupon.max_uses && ` of ${coupon.max_uses}`} {coupon.uses === 1 ? "time" : "times"}
                    {coupon.discountGivenPaise > 0 && ` · ${formatRupees(coupon.discountGivenPaise)} in discounts`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <ActionButton
                    action={setCouponActive}
                    fields={{ coupon_id: coupon.id, active: String(!coupon.active) }}
                    variant="outline"
                  >
                    {coupon.active ? "Pause" : "Turn on"}
                  </ActionButton>
                  <ActionButton
                    action={deleteCoupon}
                    fields={{ coupon_id: coupon.id }}
                    variant="ghost"
                    confirm={`Delete ${coupon.code}? Bookings that used it keep their discount.`}
                  >
                    Delete
                  </ActionButton>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function CouponStatus({ coupon, today }: { coupon: MyCoupon; today: string }) {
  if (!coupon.active) return <Badge variant="secondary">Paused</Badge>;
  if (coupon.valid_until && coupon.valid_until < today) return <Badge variant="secondary">Expired</Badge>;
  if (coupon.max_uses && coupon.uses >= coupon.max_uses) return <Badge variant="secondary">Used up</Badge>;
  return <Badge>Active</Badge>;
}
