import { z } from "zod";

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

export const batchStatusSchema = z.object({
  batch_id: z.uuid(),
  status: z.enum(["open", "closed", "cancelled"]),
});

export const batchIdSchema = z.object({ batch_id: z.uuid() });
