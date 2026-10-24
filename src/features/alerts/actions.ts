"use server";

import { refresh } from "next/cache";

import { getUser } from "@/features/auth/queries";
import type { FormState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";

import { alertIdSchema, alertTargetSchema } from "./schema";

const UNIQUE_VIOLATION = "23505";

// Trekker follows a trek or destination for new batches. RLS checks the
// email is their login email and that a trek is public.
export async function followForBatches(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user?.email) return { error: "Your session ended. Please log in again." };

  const parsed = alertTargetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Something went wrong. Please refresh and try again." };
  const { kind, target_id } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("batch_alerts").insert({
    user_id: user.id,
    email: user.email,
    ...(kind === "trek" ? { trek_id: target_id } : { destination_id: target_id }),
  });
  if (error && error.code !== UNIQUE_VIOLATION) {
    console.error("followForBatches failed:", error);
    return { error: "Couldn't turn on alerts. Please try again." };
  }

  refresh();
  return { ok: true };
}

// Trekker stops an alert. RLS lets them delete only their own.
export async function stopAlert(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = alertIdSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Something went wrong. Please refresh and try again." };

  const supabase = await createClient();
  const { error } = await supabase.from("batch_alerts").delete().eq("id", parsed.data.alert_id);
  if (error) {
    console.error("stopAlert failed:", error);
    return { error: "Couldn't turn off the alert. Please try again." };
  }

  refresh();
  return { ok: true };
}
