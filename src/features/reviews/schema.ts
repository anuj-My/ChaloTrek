import { z } from "zod";

export const reviewVisibilitySchema = z.object({
  review_id: z.uuid(),
  hidden: z.enum(["true", "false"]).transform((v) => v === "true"),
});
