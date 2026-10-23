"use server";

import { refresh } from "next/cache";

import { requireAdmin } from "@/features/auth/queries";
import { fieldErrors, type FormState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";

import { destinationIdSchema, destinationSchema } from "./schema";

const UNIQUE_VIOLATION = "23505";
const TAKEN: FormState = {
  error: "Please fix the highlighted fields.",
  fieldErrors: { name: "A trek with this name is already listed" },
};

// Admin only; RLS also checks is_admin().

export async function createDestination(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = destinationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.from("destinations").insert(parsed.data);
  if (error?.code === UNIQUE_VIOLATION) return TAKEN;
  if (error) {
    console.error("createDestination failed:", error);
    return { error: "Couldn't add it. Please try again." };
  }

  refresh();
  return { ok: true };
}

// The slug stays as it was, so the page's address (and search rankings)
// don't change when the name is tidied up.
export async function updateDestination(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = destinationIdSchema.safeParse(Object.fromEntries(formData));
  const parsed = destinationSchema.safeParse(Object.fromEntries(formData));
  if (!id.success) return { error: "Something went wrong. Please refresh and try again." };
  if (!parsed.success) return fieldErrors(parsed.error);

  const { name, region, summary } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("destinations")
    .update({ name, region, summary })
    .eq("id", id.data.destination_id);
  if (error) {
    console.error("updateDestination failed:", error);
    return { error: "Couldn't save it. Please try again." };
  }

  refresh();
  return { ok: true };
}

// Treks linked to it are kept and just lose the link.
export async function deleteDestination(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = destinationIdSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Something went wrong. Please refresh and try again." };

  const supabase = await createClient();
  const { error } = await supabase.from("destinations").delete().eq("id", parsed.data.destination_id);
  if (error) {
    console.error("deleteDestination failed:", error);
    return { error: "Couldn't delete it. Please try again." };
  }

  refresh();
  return { ok: true };
}
