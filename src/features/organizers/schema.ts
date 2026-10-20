import { z } from "zod";

// An empty form field becomes null instead of failing validation.
const optional = <T extends z.ZodType>(schema: T) =>
  z.union([z.literal("").transform(() => null), schema]);

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "At least 3 characters")
  .max(40, "At most 40 characters")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens");

export const organizerProfileSchema = z.object({
  name: z.string().trim().min(2, "Enter your company name").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9][0-9 -]{8,14}[0-9]$/, "Enter a valid phone number"),
  email: z.email("Enter a valid email address").trim().toLowerCase(),
  instagram_handle: optional(
    z
      .string()
      .trim()
      .transform((s) => s.replace(/^@/, ""))
      .pipe(z.string().regex(/^[A-Za-z0-9._]{1,30}$/, "Enter your handle, like himalayan.hikers")),
  ),
  bio: optional(z.string().trim().max(500, "At most 500 characters")),
});

export const createOrganizerSchema = organizerProfileSchema.extend({ slug: slugSchema });

export const kycSchema = z.object({
  legal_name: z.string().trim().min(2, "Enter the name on your PAN or registration").max(120),
  pan: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "PAN looks like ABCDE1234F"),
  gstin: optional(
    z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[0-9]{2}[A-Z0-9]{13}$/, "GSTIN is 15 characters, like 05ABCDE1234F1Z5"),
  ),
  tourism_reg_no: z
    .string()
    .trim()
    .min(3, "Enter your state tourism registration number")
    .max(60),
});

export const reviewSchema = z.discriminatedUnion("decision", [
  z.object({ decision: z.literal("approve"), organizer_id: z.uuid(), notes: z.string().trim() }),
  z.object({
    decision: z.literal("reject"),
    organizer_id: z.uuid(),
    notes: z.string().trim().min(5, "Tell the organizer what to fix"),
  }),
]);

// "Himalayan Hikers!" → "himalayan-hikers"
export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");
}
