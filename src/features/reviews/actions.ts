"use server";

import { refresh } from "next/cache";

import { requireAdmin } from "@/features/auth/queries";
import type { FormState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";

import { reviewVisibilitySchema } from "./schema";

// Admin hides a review from the public, or shows it again. RLS also checks
// the user is an admin.
export async function setReviewHidden(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = reviewVisibilitySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Something went wrong. Please refresh and try again." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("reviews")
    .update({ hidden: parsed.data.hidden })
    .eq("id", parsed.data.review_id);
  if (error) {
    console.error("setReviewHidden failed:", error);
    return { error: "Couldn't change the review. Please try again." };
  }

  refresh();
  return { ok: true };
}
