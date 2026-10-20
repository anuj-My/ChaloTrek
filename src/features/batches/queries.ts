import "server-only";

import { requireMyOrganizer } from "@/features/organizers/queries";
import { todayInIndia } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

// Upcoming batches across all of the organizer's treks, soonest first.
export async function listMyUpcomingBatches() {
  const organizer = await requireMyOrganizer();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("batches")
    .select("*, seats_left, treks!inner(id, name, organizer_id)")
    // RLS lets anyone read batches of published treks, so filter explicitly.
    .eq("treks.organizer_id", organizer.id)
    .gte("end_date", todayInIndia())
    .order("start_date");
  if (error) throw error;
  return data;
}
