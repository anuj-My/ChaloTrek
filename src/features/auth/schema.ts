import { z } from "zod";

export const emailSchema = z.email("Enter a valid email address").trim().toLowerCase();
