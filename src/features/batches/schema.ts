import { z } from "zod";

import { addDays } from "@/lib/format";

const date = z.iso.date("Pick a date");

// Rupees typed by the organizer → integer paise for the database.
const rupeesToPaise = z.coerce
  .number("Enter an amount")
  .int("Whole rupees only")
  .min(100, "At least ₹100")
  .max(500000, "At most ₹5,00,000")
  .transform((rupees) => rupees * 100);

export const batchSchema = z
  .object({
    trek_id: z.uuid(),
    start_date: date,
    end_date: date,
    price: rupeesToPaise,
    deposit: z.union([z.literal("").transform(() => null), rupeesToPaise]),
    total_seats: z.coerce.number().int("Whole seats only").min(1, "At least 1 seat").max(200),
  })
  .refine((b) => b.end_date >= b.start_date, {
    path: ["end_date"],
    message: "Ends before it starts",
  })
  .refine((b) => b.deposit === null || b.deposit < b.price, {
    path: ["deposit"],
    message: "The deposit must be less than the price",
  })
  .transform(({ price, deposit, ...rest }) => ({
    ...rest,
    price_paise: price,
    deposit_paise: deposit,
  }));

export const MAX_REPEATS = 12;

// Adding a batch can also add copies of it every week or two, for treks that
// run the same weekend again and again.
export const REPEAT_OPTIONS = [
  { value: "once", label: "Just once", days: 0 },
  { value: "weekly", label: "Every week", days: 7 },
  { value: "fortnightly", label: "Every 2 weeks", days: 14 },
] as const;

export const repeatSchema = z.object({
  repeat: z.enum(["once", "weekly", "fortnightly"]).default("once"),
  repeat_count: z.coerce
    .number<string>()
    .int()
    .min(2, "At least 2")
    .max(MAX_REPEATS, `At most ${MAX_REPEATS}`)
    .optional(),
});

// Start and end dates of each batch to add: the first, then every `days`.
export function repeatDates(start: string, end: string, days: number, count: number) {
  return Array.from({ length: days ? count : 1 }, (_, i) => ({
    start_date: addDays(start, i * days),
    end_date: addDays(end, i * days),
  }));
}

export const batchStatusSchema = z.object({
  batch_id: z.uuid(),
  status: z.enum(["open", "closed", "cancelled"]),
});

export const batchIdSchema = z.object({ batch_id: z.uuid() });
