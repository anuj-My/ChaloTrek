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

export const participantSchema = z.object({
  full_name: z.string().trim().min(2, "Enter their full name").max(100),
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

export const PARTICIPANT_FIELDS = Object.keys(participantSchema.shape) as (keyof typeof participantSchema.shape)[];

export const bookingSchema = z.object({
  batch_id: z.uuid(),
  contact_email: z.email("Enter a valid email address").trim().toLowerCase(),
  contact_phone: phone,
  participants: z.array(participantSchema).min(1).max(MAX_PEOPLE_PER_BOOKING),
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
    participants: Array.from({ length: people }, (_, i) =>
      Object.fromEntries(PARTICIPANT_FIELDS.map((field) => [field, formData.get(`participants.${i}.${field}`) ?? ""])),
    ),
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
