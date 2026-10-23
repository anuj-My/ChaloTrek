import { z } from "zod";

import { slugify } from "@/features/organizers/schema";
import { REGIONS } from "@/features/treks/schema";

// Admin form. The slug is the page address (/treks/<slug>) and comes from
// the name, so search engines see "kedarkantha", not an id.
export const destinationSchema = z
  .object({
    name: z.string().trim().min(2, "Enter the trek's name").max(80),
    region: z.enum(REGIONS, "Pick a region"),
    summary: z.string().trim().max(2000, "At most 2,000 characters"),
  })
  .transform(({ summary, ...rest }) => ({ ...rest, slug: slugify(rest.name), summary: summary || null }));

export const destinationIdSchema = z.object({ destination_id: z.uuid() });
