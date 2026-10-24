import "server-only";

import { getUser, requireUser } from "@/features/auth/queries";
import { createClient } from "@/lib/supabase/server";

import type { AlertTarget } from "./schema";

// The logged-in trekker's alert for a trek or destination: its id, or null
// when they don't follow it (or aren't logged in).
export async function getMyAlertId({ kind, target_id }: AlertTarget) {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("batch_alerts")
    .select("id")
    .eq("user_id", user.id)
    .eq(kind === "trek" ? "trek_id" : "destination_id", target_id)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

// Everything the logged-in trekker follows, newest first.
export async function listMyAlerts() {
  const user = await requireUser("/my-bookings/alerts");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("batch_alerts")
    .select("id, created_at, treks(name, slug, organizers(name, slug)), destinations(name, slug)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
