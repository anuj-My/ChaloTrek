"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { getMyOrganizer } from "@/features/organizers/queries";
import { fieldErrors, type FormState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";

import { trekSchema, trekStatusSchema } from "./schema";

const UNIQUE_VIOLATION = "23505";
const SLUG_TAKEN: FormState = {
  error: "Please fix the highlighted fields.",
  fieldErrors: { slug: "You already have a trek with this link." },
};

export async function createTrek(_prev: FormState, formData: FormData): Promise<FormState> {
  const organizer = await getMyOrganizer();
  if (!organizer) return { error: "Create your organizer profile first." };

  const parsed = trekSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("treks")
    .insert({ ...parsed.data, organizer_id: organizer.id })
    .select("id")
    .single();
  if (error?.code === UNIQUE_VIOLATION) return SLUG_TAKEN;
  if (error) {
    console.error("createTrek failed:", error);
    return { error: "Couldn't create the trek. Please try again." };
  }

  redirect(`/dashboard/treks/${data.id}`);
}

export async function updateTrek(_prev: FormState, formData: FormData): Promise<FormState> {
  const organizer = await getMyOrganizer();
  if (!organizer) return { error: "Create your organizer profile first." };

  const trekId = formData.get("trek_id")?.toString() ?? "";
  const parsed = trekSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("treks")
    .select("slug, status")
    .eq("id", trekId)
    .eq("organizer_id", organizer.id)
    .maybeSingle();
  if (!current) return { error: "Trek not found." };

  // The booking link is shared once published, so the slug stays fixed then.
  const values =
    current.status === "draft" ? parsed.data : { ...parsed.data, slug: current.slug };

  const { error } = await supabase.from("treks").update(values).eq("id", trekId);
  if (error?.code === UNIQUE_VIOLATION) return SLUG_TAKEN;
  if (error) {
    console.error("updateTrek failed:", error);
    return { error: "Couldn't save the trek. Please try again." };
  }

  refresh();
  return { ok: true };
}

export async function setTrekStatus(_prev: FormState, formData: FormData): Promise<FormState> {
  const organizer = await getMyOrganizer();
  if (!organizer) return { error: "Create your organizer profile first." };

  const parsed = trekStatusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Something went wrong. Please refresh and try again." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("treks")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.trek_id)
    .eq("organizer_id", organizer.id);
  if (error) {
    console.error("setTrekStatus failed:", error);
    return { error: "Couldn't change the status. Please try again." };
  }

  refresh();
  return { ok: true };
}
