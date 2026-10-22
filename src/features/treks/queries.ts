import "server-only";

import { notFound } from "next/navigation";
import { cache } from "react";

import { requireMyOrganizer } from "@/features/organizers/queries";
import { todayInIndia } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

import { trekPhotoUrl } from "./photos";
import type { ItineraryDay } from "./schema";

// RLS also lets anyone read *published* treks, so the organizer queries here
// filter by the organizer explicitly rather than relying on RLS alone.

export async function listMyTreks() {
  const organizer = await requireMyOrganizer();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("treks")
    .select("id, name, slug, status, region, difficulty, duration_days, batches(id, start_date, status)")
    .eq("organizer_id", organizer.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return { organizer, treks: data };
}

export async function getMyTrek(trekId: string) {
  const organizer = await requireMyOrganizer();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("treks")
    .select("*, batches(*, seats_left)")
    .eq("id", trekId)
    .eq("organizer_id", organizer.id)
    .order("start_date", { referencedTable: "batches" })
    .maybeSingle();
  if (error?.code === "22P02") notFound(); // not a valid uuid
  if (error) throw error;
  if (!data) notFound();
  return { organizer, trek: { ...data, itinerary: data.itinerary as ItineraryDay[] } };
}

export type MyTrek = Awaited<ReturnType<typeof getMyTrek>>["trek"];

export async function listCancellationPolicies() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cancellation_policies")
    .select("id, name, description")
    .order("id");
  if (error) throw error;
  return data;
}

export type CancellationPolicy = Awaited<ReturnType<typeof listCancellationPolicies>>[number];

// A trek as the public booking page shows it: published, by an approved
// organizer, with upcoming batches and live seats. Null when it isn't public.
// The owner can read their drafts through RLS, so filter explicitly here too.
// Deduplicated per request (generateMetadata and the page both call it).
export const getPublicTrek = cache(async (organizerSlug: string, trekSlug: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("treks")
    .select(
      `id, name, slug, region, difficulty, duration_days, max_altitude_m, summary,
       itinerary, inclusions, exclusions, photos,
       organizers!inner(name, slug, bio, instagram_handle),
       cancellation_policies(name, description),
       batches(id, start_date, end_date, price_paise, deposit_paise, total_seats, status, seats_left)`,
    )
    .eq("slug", trekSlug)
    .eq("status", "published")
    .eq("organizers.slug", organizerSlug)
    .eq("organizers.kyc_status", "approved")
    // Bookings close the day before departure (see book_batch).
    .gt("batches.start_date", todayInIndia())
    .neq("batches.status", "cancelled")
    .order("start_date", { referencedTable: "batches" })
    .maybeSingle();
  if (error) throw error;
  return (
    data && {
      ...data,
      itinerary: data.itinerary as ItineraryDay[],
      photos: data.photos.map(trekPhotoUrl), // full URLs, cover first
    }
  );
});

export type PublicTrek = NonNullable<Awaited<ReturnType<typeof getPublicTrek>>>;
