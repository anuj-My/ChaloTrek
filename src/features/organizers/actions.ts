"use server";

import { refresh } from "next/cache";

import { getUser, requireAdmin } from "@/features/auth/queries";
import { fieldErrors, type FormState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";

import { getMyOrganizer } from "./queries";
import { createOrganizerSchema, kycSchema, organizerProfileSchema, reviewSchema } from "./schema";

const UNIQUE_VIOLATION = "23505";

export async function createOrganizer(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) return { error: "Your session expired. Please log in again." };

  const parsed = createOrganizerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizers")
    .insert({ ...parsed.data, owner_user_id: user.id });

  if (error?.code === UNIQUE_VIOLATION) {
    return error.message.includes("slug")
      ? { fieldErrors: { slug: "This link is taken. Try another." } }
      : { error: "You already have an organizer profile." };
  }
  if (error) {
    console.error("createOrganizer failed:", error);
    return { error: "Couldn't create your profile. Please try again." };
  }

  refresh();
  return { ok: true };
}

export async function updateOrganizer(_prev: FormState, formData: FormData): Promise<FormState> {
  const organizer = await getMyOrganizer();
  if (!organizer) return { error: "Create your organizer profile first." };

  const parsed = organizerProfileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.from("organizers").update(parsed.data).eq("id", organizer.id);
  if (error) {
    console.error("updateOrganizer failed:", error);
    return { error: "Couldn't save your changes. Please try again." };
  }

  refresh();
  return { ok: true };
}

export async function submitKyc(_prev: FormState, formData: FormData): Promise<FormState> {
  const organizer = await getMyOrganizer();
  if (!organizer) return { error: "Create your organizer profile first." };
  if (organizer.kyc_status === "approved") {
    return { error: "Your KYC is approved and locked. Contact us to change it." };
  }

  const parsed = kycSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.from("organizer_kyc").upsert({
    ...parsed.data,
    organizer_id: organizer.id,
    submitted_at: new Date().toISOString(),
  });
  if (error) {
    console.error("submitKyc failed:", error);
    return { error: "Couldn't submit your details. Please try again." };
  }

  refresh();
  return { ok: true };
}

export async function reviewOrganizer(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fieldErrors(parsed.error);
  const { decision, organizer_id, notes } = parsed.data;

  const supabase = await createClient();
  const { data: kyc } = await supabase
    .from("organizer_kyc")
    .select("submitted_at")
    .eq("organizer_id", organizer_id)
    .maybeSingle();
  if (decision === "approve" && !kyc?.submitted_at) {
    return { error: "This organizer hasn't submitted KYC yet." };
  }

  if (kyc) {
    const { error } = await supabase
      .from("organizer_kyc")
      .update({ review_notes: notes || null, reviewed_at: new Date().toISOString() })
      .eq("organizer_id", organizer_id);
    if (error) {
      console.error("reviewOrganizer (kyc) failed:", error);
      return { error: "Couldn't save the review." };
    }
  }

  const { error } = await supabase
    .from("organizers")
    .update({ kyc_status: decision === "approve" ? "approved" : "rejected" })
    .eq("id", organizer_id);
  if (error) {
    console.error("reviewOrganizer failed:", error);
    return { error: "Couldn't save the review." };
  }

  refresh();
  return { ok: true };
}
