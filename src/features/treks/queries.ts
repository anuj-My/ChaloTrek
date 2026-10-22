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

// An approved organizer's public page: their published treks with upcoming
// batches. Null when the organizer doesn't exist or isn't approved yet.
// Deduplicated per request (generateMetadata and the page both call it).
export const getPublicOrganizerTreks = cache(async (organizerSlug: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizers")
    .select(
      `name, slug, bio, instagram_handle,
       treks(id, name, slug, region, difficulty, duration_days, max_altitude_m, summary, photos, status,
         batches(id, start_date, end_date, price_paise, status, seats_left))`,
    )
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

  const treks = data.treks
    .map(({ photos, batches, ...trek }) => {
      const bookable = batches.filter((b) => b.status === "open" && (b.seats_left ?? 0) > 0);
      return {
        ...trek,
        coverUrl: photos[0] ? trekPhotoUrl(photos[0]) : null,
        nextBatch: bookable[0] ?? null,
        bookableBatches: bookable.length,
        fromPricePaise: bookable.length ? Math.min(...bookable.map((b) => b.price_paise)) : null,
      };
    })
    // Treks you can book soonest first; the rest after, by name.
    .sort((a, b) => {
      if (a.nextBatch && b.nextBatch) return a.nextBatch.start_date.localeCompare(b.nextBatch.start_date);
      if (a.nextBatch || b.nextBatch) return a.nextBatch ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  return { ...data, treks };
});

export type PublicOrganizerTrek = NonNullable<Awaited<ReturnType<typeof getPublicOrganizerTreks>>>["treks"][number];
