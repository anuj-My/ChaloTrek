import "server-only";

import { cache } from "react";

import { requireAdmin } from "@/features/auth/queries";
import { createClient } from "@/lib/supabase/server";

// Every destination, for the organizer's trek form and the admin list.
export async function listDestinations() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("destinations")
    .select("id, name, slug, region")
    .order("region")
    .order("name");
  if (error) throw error;
  return data;
}

export type Destination = Awaited<ReturnType<typeof listDestinations>>[number];

// One destination by its slug, or null. Deduplicated per request
// (generateMetadata and the page both call it).
export const getDestination = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("destinations")
    .select("id, name, slug, region, summary")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
});

// Destinations with at least one live trek, and how many organizers run it,
// for the explore page.
export async function listLiveDestinations() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("destinations")
    .select("name, slug, treks!inner(organizer_id, status, organizers!inner(kyc_status))")
    .eq("treks.status", "published")
    .eq("treks.organizers.kyc_status", "approved")
    .order("name");
  if (error) throw error;
  return data
    .map(({ name, slug, treks }) => ({ name, slug, organizers: new Set(treks.map((t) => t.organizer_id)).size }))
    .sort((a, b) => b.organizers - a.organizers || a.name.localeCompare(b.name));
}

// Admin: destinations with how many treks use each.
export async function listDestinationsForAdmin() {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("destinations")
    .select("id, name, slug, region, summary, treks(count)")
    .order("region")
    .order("name");
  if (error) throw error;
  return data.map(({ treks, ...d }) => ({ ...d, trekCount: treks[0]?.count ?? 0 }));
}
