import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { getUser, requireAdmin } from "@/features/auth/queries";
import { createClient } from "@/lib/supabase/server";

const WITH_KYC = "*, organizer_kyc(*)";

// The logged-in user's organizer profile with KYC, or null if they haven't
// created one yet. Deduplicated per request.
export const getMyOrganizer = cache(async () => {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizers")
    .select(WITH_KYC)
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
});

export type MyOrganizer = NonNullable<Awaited<ReturnType<typeof getMyOrganizer>>>;
export type OrganizerKyc = MyOrganizer["organizer_kyc"];

// For dashboard pages that need a profile: sends the user to set one up first.
export async function requireMyOrganizer() {
  const organizer = await getMyOrganizer();
  if (!organizer) redirect("/dashboard");
  return organizer;
}

export async function listOrganizersForReview() {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizers")
    .select(WITH_KYC)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

// True when KYC was submitted (or resubmitted) after the last admin review.
export function awaitingReview(kyc: Pick<NonNullable<OrganizerKyc>, "submitted_at" | "reviewed_at"> | null) {
  if (!kyc?.submitted_at) return false;
  return !kyc.reviewed_at || kyc.submitted_at > kyc.reviewed_at;
}
