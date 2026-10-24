import { z } from "zod";

export const MAX_PEOPLE_PER_BOOKING = 20;

export const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
] as const;

const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9][0-9 -]{8,14}[0-9]$/, "Enter a valid phone number");

const optionalPhone = z.union([z.literal(""), phone]);

const fullName = z.string().trim().min(2, "Enter their full name").max(100);

// What each person fills in about themselves, on the booking form or on
// their own details link.
export const participantDetailsSchema = z.object({
  age: z
    .string()
    .trim()
    .min(1, "Enter their age")
    .pipe(z.coerce.number<string>("Enter their age").int("Enter their age").min(5, "At least 5").max(90, "At most 90")),
  gender: z.enum(["male", "female", "other"], "Pick one"),
  phone: optionalPhone,
  emergency_contact_name: z.string().trim().min(2, "Enter a name").max(100),
  emergency_contact_phone: phone,
  medical_notes: z.string().trim().max(500, "At most 500 characters"),
});

// On the booking form, someone can be left to fill in their own details
// ("self_fill"), with just their name and optionally a phone.
export const participantSchema = z.discriminatedUnion("self_fill", [
  participantDetailsSchema.extend({ self_fill: z.literal(false), full_name: fullName }),
  z.object({ self_fill: z.literal(true), full_name: fullName, phone: optionalPhone }),
]);

export const PARTICIPANT_FIELDS = ["full_name", ...Object.keys(participantDetailsSchema.shape)];

// The details link: the token from the URL plus the person's details.
export const participantDetailsFormSchema = participantDetailsSchema.extend({ token: z.uuid() });

const couponCode = z.string().trim().toUpperCase().max(20);

export const couponCheckSchema = z.object({ batch_id: z.uuid(), code: couponCode.min(1, "Enter a code") });

export const bookingSchema = z.object({
  batch_id: z.uuid(),
  contact_email: z.email("Enter a valid email address").trim().toLowerCase(),
  contact_phone: phone,
  participants: z.array(participantSchema).min(1).max(MAX_PEOPLE_PER_BOOKING),
  // Applied on the form after check_coupon(); book_batch() checks it again.
  coupon_code: couponCode.optional(),
});

export type BookingInput = z.infer<typeof bookingSchema>;

// The form names participant fields "participants.<index>.<field>", matching
// the error paths zod reports. This rebuilds the nested object for parsing.
export function bookingFromFormData(formData: FormData) {
  const count = Number(formData.get("num_people"));
  const people = Number.isInteger(count) ? Math.min(Math.max(count, 0), MAX_PEOPLE_PER_BOOKING) : 0;
  return {
    batch_id: formData.get("batch_id"),
    contact_email: formData.get("contact_email"),
    contact_phone: formData.get("contact_phone"),
    coupon_code: formData.get("coupon_code") ?? undefined,
    participants: Array.from({ length: people }, (_, i) => ({
      ...Object.fromEntries(PARTICIPANT_FIELDS.map((field) => [field, formData.get(`participants.${i}.${field}`) ?? ""])),
      self_fill: formData.get(`participants.${i}.self_fill`) === "on",
    })),
  };
}

// Organizer records money received outside Chalo Trek: the total so far, in
// rupees, converted to paise.
export const offlinePaymentSchema = z.object({
  booking_id: z.uuid(),
  amount: z.coerce
    .number<string>("Enter the amount")
    .int("Whole rupees only")
    .min(1, "Enter the amount")
    .transform((rupees) => rupees * 100),
});

export const bookingIdSchema = z.object({ booking_id: z.uuid() });

// A batch's WhatsApp group invite link. Links copied from WhatsApp often end
// in "?mode=…", which is dropped. Empty removes the link.
const WHATSAPP_INVITE = /^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]{10,40}$/;

export const groupLinkSchema = z.object({
  batch_id: z.uuid(),
  url: z
    .string()
    .trim()
    .transform((url) => url.split(/[?#]/)[0].replace(/\/+$/, "").replace(/^http:\/\//, "https://"))
    .refine((url) => url === "" || WHATSAPP_INVITE.test(url), "Paste a WhatsApp group invite link (chat.whatsapp.com/…)"),
});

export const waitlistSchema = z.object({
  batch_id: z.uuid(),
  num_people: z.coerce.number<string>().int().min(1).max(MAX_PEOPLE_PER_BOOKING),
});

export const batchIdSchema = z.object({ batch_id: z.uuid() });

export const waitlistEntryIdSchema = z.object({ entry_id: z.uuid() });

export const reviewSchema = z.object({
  booking_id: z.uuid(),
  rating: z.coerce.number<string>("Pick a rating").int().min(1, "Pick a rating").max(5),
  body: z.string().trim().max(2000, "At most 2,000 characters"),
  author_name: z.string().trim().min(2, "Enter the name to show").max(50, "At most 50 characters"),
});

// ─── UPI payment proofs ─────────────────────────────────────────────────────

// Trekker says they've paid the organizer by UPI.
export const paymentProofSchema = z.object({
  booking_id: z.uuid(),
  // Rupees in the form, paise in the database.
  amount: z.coerce
    .number<string>("Enter the amount you paid")
    .int("Whole rupees only")
    .min(1, "Enter the amount you paid")
    .transform((rupees) => rupees * 100),
  utr: z
    .string()
    .trim()
    .transform((s) => s.replace(/\s/g, ""))
    .pipe(z.string().regex(/^[A-Za-z0-9]{6,35}$/, "Enter the UPI transaction ID (UTR) from your UPI app")),
  screenshot_path: z
    .string()
    .optional()
    .transform((s) => s || null),
});

// Organizer accepts or rejects a payment proof.
export const reviewProofSchema = z.discriminatedUnion("decision", [
  z.object({ decision: z.literal("accept"), proof_id: z.uuid() }),
  z.object({
    decision: z.literal("reject"),
    proof_id: z.uuid(),
    reason: z.string().trim().min(5, "Tell the trekker what's wrong").max(300),
  }),
]);
