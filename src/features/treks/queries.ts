import "server-only";

import { notFound } from "next/navigation";

import { requireMyOrganizer } from "@/features/organizers/queries";
import { createClient } from "@/lib/supabase/server";

import type { ItineraryDay } from "./schema";

// RLS also lets anyone read *published* treks, so every query here filters by
// the organizer explicitly rather than relying on RLS alone.

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
