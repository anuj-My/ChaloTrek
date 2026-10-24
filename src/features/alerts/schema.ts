import { z } from "zod";

// What a trekker follows for new batches: one organizer's trek, or every
// organizer's trek at a destination.
export const alertTargetSchema = z.object({
  kind: z.enum(["trek", "destination"]),
  target_id: z.uuid(),
});

export type AlertTarget = z.infer<typeof alertTargetSchema>;

export const alertIdSchema = z.object({ alert_id: z.uuid() });
