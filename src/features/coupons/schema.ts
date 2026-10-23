import { z } from "zod";

const optionalInt = (min: number, max: number, message: string) =>
  z.union([
    z.literal("").transform(() => null),
    z.coerce.number<string>(message).int(message).min(min, message).max(max, message),
  ]);

// The organizer's form: a code, a percentage or a flat amount per person, and
// optional limits. Converted to the coupons table's columns.
export const couponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9]{3,20}$/, "3 to 20 letters or numbers, no spaces"),
    kind: z.enum(["percent", "amount"]),
    value: z.coerce.number<string>("Enter the discount").int("Whole numbers only").min(1, "Enter the discount"),
    trek_id: z.union([z.literal("").transform(() => null), z.uuid()]),
    max_uses: optionalInt(1, 10000, "Enter a number of uses"),
    valid_until: z.union([z.literal("").transform(() => null), z.iso.date("Pick a date")]),
  })
  .refine((c) => c.kind !== "percent" || c.value <= 90, { path: ["value"], message: "At most 90%" })
  .refine((c) => c.kind !== "amount" || c.value <= 100000, { path: ["value"], message: "At most ₹1,00,000" })
  .transform(({ kind, value, ...rest }) => ({
    ...rest,
    percent_off: kind === "percent" ? value : null,
    amount_off_paise: kind === "amount" ? value * 100 : null,
  }));

export const couponActiveSchema = z.object({
  coupon_id: z.uuid(),
  active: z.enum(["true", "false"]).transform((v) => v === "true"),
});

export const couponIdSchema = z.object({ coupon_id: z.uuid() });
