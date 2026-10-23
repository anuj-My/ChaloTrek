import "server-only";

import { requireAdmin } from "@/features/auth/queries";
import { createClient } from "@/lib/supabase/server";

// Public reviews, newest first. RLS also shows hidden reviews to their
// author, the organizer and admins, so public lists filter them explicitly.
// Every review is fetched to work out the average, which is fine at our
// scale; switch to a database aggregate once treks have hundreds.

const REVIEW_FIELDS = "id, author_name, rating, body, created_at";

function withSummary<R extends { rating: number }>(reviews: R[]) {
  const count = reviews.length;
  const average = count ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : null;
  return { reviews, count, average };
}

export async function getTrekReviews(trekId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(REVIEW_FIELDS)
    .eq("trek_id", trekId)
    .eq("hidden", false)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return withSummary(data);
}

export async function getOrganizerReviews(organizerSlug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(`${REVIEW_FIELDS}, treks!inner(name), organizers!inner(slug)`)
    .eq("organizers.slug", organizerSlug)
    .eq("hidden", false)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return withSummary(
    data.map(({ id, author_name, rating, body, created_at, treks }) => ({
      id,
      author_name,
      rating,
      body,
      created_at,
      trekName: treks.name,
    })),
  );
}

export type ReviewSummary = Awaited<ReturnType<typeof getTrekReviews>>;

// Average rating and count per trek, for lists that compare treks.
export async function getTrekRatings(trekIds: string[]) {
  const ratings = new Map<string, { average: number; count: number }>();
  if (trekIds.length === 0) return ratings;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("trek_id, rating")
    .in("trek_id", trekIds)
    .eq("hidden", false);
  if (error) throw error;
  for (const { trek_id, rating } of data) {
    const r = ratings.get(trek_id) ?? { average: 0, count: 0 };
    r.average = (r.average * r.count + rating) / (r.count + 1);
    r.count += 1;
    ratings.set(trek_id, r);
  }
  return ratings;
}

// Admin: every review, newest first, hidden ones included.
export async function listAllReviews() {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(`${REVIEW_FIELDS}, hidden, treks(name, slug), organizers(name, slug)`)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data;
}
