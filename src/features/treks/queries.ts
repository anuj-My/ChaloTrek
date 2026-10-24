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
       organizers!inner(name, slug, bio, instagram_handle, verified_at),
       cancellation_policies(name, description),
       destinations(name, slug),
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

// ─── Trek cards (organizer page, homepage) ─────────────────────────────────

const TREK_CARD_FIELDS = `id, name, slug, region, difficulty, duration_days, max_altitude_m, photos,
  batches(id, start_date, end_date, price_paise, status, seats_left)`;

type TrekCardRow = {
  photos: string[];
  batches: { id: string; start_date: string; end_date: string; price_paise: number; status: string; seats_left: number | null }[];
};

// Cover photo, next open batch and starting price, from a trek whose batches
// are already limited to upcoming, non-cancelled ones (sorted by date).
function toTrekCard<T extends TrekCardRow>({ photos, batches, ...trek }: T) {
  const bookable = batches.filter((b) => b.status === "open" && (b.seats_left ?? 0) > 0);
  return {
    ...trek,
    coverUrl: photos[0] ? trekPhotoUrl(photos[0]) : null,
    nextBatch: bookable[0] ?? null,
    bookableBatches: bookable.length,
    fromPricePaise: bookable.length ? Math.min(...bookable.map((b) => b.price_paise)) : null,
  };
}

// Treks you can book soonest first; the rest after, by name.
function bySoonestBatch<C extends { name: string; nextBatch: { start_date: string } | null }>(a: C, b: C) {
  if (a.nextBatch && b.nextBatch) return a.nextBatch.start_date.localeCompare(b.nextBatch.start_date);
  if (a.nextBatch || b.nextBatch) return a.nextBatch ? -1 : 1;
  return a.name.localeCompare(b.name);
}

// An approved organizer's public page: their published treks with upcoming
// batches. Null when the organizer doesn't exist or isn't approved yet.
// Deduplicated per request (generateMetadata and the page both call it).
export const getPublicOrganizerTreks = cache(async (organizerSlug: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizers")
    .select(`name, slug, bio, instagram_handle, verified_at, treks(${TREK_CARD_FIELDS})`)
    .eq("slug", organizerSlug)
    .eq("kyc_status", "approved")
    // The owner can read their drafts through RLS, so filter explicitly.
    .eq("treks.status", "published")
    .gt("treks.batches.start_date", todayInIndia())
    .neq("treks.batches.status", "cancelled")
    .order("start_date", { referencedTable: "treks.batches" })
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { ...data, treks: data.treks.map(toTrekCard).sort(bySoonestBatch) };
});


// Homepage: live treks from every approved organizer that have an open batch
// coming up, soonest first.
export async function listUpcomingPublicTreks(limit: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("treks")
    .select(`${TREK_CARD_FIELDS}, organizers!inner(name, slug, verified_at)`)
    .eq("status", "published")
    .eq("organizers.kyc_status", "approved")
    .gt("batches.start_date", todayInIndia())
    .neq("batches.status", "cancelled")
    .order("start_date", { referencedTable: "batches" });
  if (error) throw error;
  return data
    .map(toTrekCard)
    .filter((trek) => trek.nextBatch)
    .sort(bySoonestBatch)
    .slice(0, limit);
}

// ─── Marketplace ────────────────────────────────────────────────────────────

// Every live trek from approved organizers, for the explore page, or only
// those at one destination for its comparison page. Keeps each trek's
// bookable batches (dates and prices) so pages can filter and compare them.
// Treks with nothing to book come last.
export async function listPublicTreks(destinationId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("treks")
    .select(`${TREK_CARD_FIELDS}, organizers!inner(name, slug, verified_at)`)
    .eq("status", "published")
    .eq("organizers.kyc_status", "approved")
    .gt("batches.start_date", todayInIndia())
    .neq("batches.status", "cancelled")
    .order("start_date", { referencedTable: "batches" });
  if (destinationId) query = query.eq("destination_id", destinationId);
  const { data, error } = await query;
  if (error) throw error;
  return data
    .map((trek) => ({
      ...toTrekCard(trek),
      bookable: trek.batches.filter((b) => b.status === "open" && (b.seats_left ?? 0) > 0),
    }))
    .sort(bySoonestBatch);
}

export type PublicTrekListing = Awaited<ReturnType<typeof listPublicTreks>>[number];

// Pages for the sitemap: approved organizers and their published treks.
export async function listSitemapEntries() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizers")
    .select("slug, updated_at, treks(slug, updated_at, destinations(slug))")
    .eq("kyc_status", "approved")
    .eq("treks.status", "published");
  if (error) throw error;
  return data;
}
