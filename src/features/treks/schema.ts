import { z } from "zod";

import { slugSchema } from "@/features/organizers/schema";

export const REGIONS = [
  "Uttarakhand",
  "Himachal Pradesh",
  "Ladakh",
  "Jammu & Kashmir",
  "Sikkim",
  "Other",
] as const;

export const DIFFICULTIES = [
  { value: "easy", label: "Easy" },
  { value: "moderate", label: "Moderate" },
  { value: "difficult", label: "Difficult" },
  { value: "challenging", label: "Challenging" },
] as const;

export const itineraryDaySchema = z.object({
  title: z.string().trim().min(2, "Give each day a title").max(100),
  description: z.string().trim().max(1000),
});

export type ItineraryDay = z.infer<typeof itineraryDaySchema>;

// The itinerary editor submits its rows as one JSON field.
const itinerarySchema = z
  .string()
  .transform((value, ctx) => {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      ctx.addIssue({ code: "custom", message: "Itinerary couldn't be read" });
      return z.NEVER;
    }
  })
  .pipe(z.array(itineraryDaySchema).max(60));

// One item per line in a textarea; blank lines are dropped.
const linesSchema = z
  .string()
  .transform((value) =>
    value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
  )
  .pipe(z.array(z.string().max(200, "Keep each line under 200 characters")).max(40));

const optionalInt = z
  .union([z.literal("").transform(() => null), z.coerce.number().int()])
  .pipe(z.number().int().min(100, "Enter the altitude in metres").max(9000).nullable());

export const trekSchema = z.object({
  name: z.string().trim().min(3, "Enter the trek name").max(80),
  slug: slugSchema,
  region: z.enum(REGIONS, "Pick a region"),
  difficulty: z.enum(["easy", "moderate", "difficult", "challenging"], "Pick a difficulty"),
  duration_days: z.coerce.number().int("Whole days only").min(1, "At least 1 day").max(60),
  max_altitude_m: optionalInt,
  summary: z.string().trim().max(1000, "At most 1000 characters"),
  itinerary: itinerarySchema,
  inclusions: linesSchema,
  exclusions: linesSchema,
  cancellation_policy_id: z.coerce.number().int().min(1, "Pick a cancellation policy"),
});

export const trekStatusSchema = z.object({
  trek_id: z.uuid(),
  status: z.enum(["draft", "published", "archived"]),
});
