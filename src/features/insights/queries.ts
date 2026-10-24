import "server-only";

import { requireMyOrganizer } from "@/features/organizers/queries";
import { addDays, todayInIndia } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const INSIGHTS_DAYS = 30;

export type SourceRow = {
  // '' for visitors who came without a tag.
  tag: string;
  views: number;
  bookings: number;
  confirmed: number;
  confirmedPaise: number;
};

// Trek page views and bookings per source tag over the last 30 days, for the
// logged-in organizer. RLS limits both to their own treks; the filters make
// it explicit.
export async function getSourceInsights() {
  const organizer = await requireMyOrganizer();
  const supabase = await createClient();
  const since = addDays(todayInIndia(), -(INSIGHTS_DAYS - 1));

  const [views, bookings] = await Promise.all([
    supabase
      .from("trek_views")
      .select("source_tag, views, treks!inner(organizer_id)")
      .eq("treks.organizer_id", organizer.id)
      .gte("day", since),
    supabase
      .from("bookings")
      .select("source_tag, status, total_paise, batches!inner(treks!inner(organizer_id))")
      .eq("batches.treks.organizer_id", organizer.id)
      .gte("created_at", new Date(`${since}T00:00:00+05:30`).toISOString()),
  ]);
  if (views.error) throw views.error;
  if (bookings.error) throw bookings.error;

  const rows = new Map<string, SourceRow>();
  const row = (tag: string | null) => {
    const key = tag ?? "";
    if (!rows.has(key)) rows.set(key, { tag: key, views: 0, bookings: 0, confirmed: 0, confirmedPaise: 0 });
    return rows.get(key)!;
  };
  for (const v of views.data) row(v.source_tag).views += v.views;
  for (const b of bookings.data) {
    const r = row(b.source_tag);
    r.bookings += 1;
    if (b.status === "confirmed") {
      r.confirmed += 1;
      r.confirmedPaise += b.total_paise;
    }
  }

  const sorted = [...rows.values()].sort((a, b) => b.views - a.views || b.bookings - a.bookings);
  const total = sorted.reduce(
    (sum, r) => ({
      tag: "",
      views: sum.views + r.views,
      bookings: sum.bookings + r.bookings,
      confirmed: sum.confirmed + r.confirmed,
      confirmedPaise: sum.confirmedPaise + r.confirmedPaise,
    }),
    { tag: "", views: 0, bookings: 0, confirmed: 0, confirmedPaise: 0 },
  );
  return { organizerSlug: organizer.slug, rows: sorted, total };
}
