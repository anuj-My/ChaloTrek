"use server";

import { refresh } from "next/cache";
import { after } from "next/server";

import { notifyWaitlist } from "@/features/bookings/waitlist";
import { getMyOrganizer } from "@/features/organizers/queries";
import { todayInIndia } from "@/lib/format";
import { fieldErrors, type FormState } from "@/lib/form-state";
import { requestOrigin } from "@/lib/request-origin";
import { createClient } from "@/lib/supabase/server";

import { batchIdSchema, batchSchema, batchStatusSchema, REPEAT_OPTIONS, repeatDates, repeatSchema } from "./schema";

const FOREIGN_KEY_VIOLATION = "23503";

// Loads a batch only if it belongs to one of the current organizer's treks.
async function getOwnBatch(batchId: string) {
  const organizer = await getMyOrganizer();
  if (!organizer) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("batches")
    .select("id, total_seats, seats_left, treks!inner(organizer_id)")
    .eq("id", batchId)
    .eq("treks.organizer_id", organizer.id)
    .maybeSingle();
  return data;
}

async function ownsTrek(trekId: string) {
  const organizer = await getMyOrganizer();
  if (!organizer) return false;
  const supabase = await createClient();
  const { data } = await supabase
    .from("treks")
    .select("id")
    .eq("id", trekId)
    .eq("organizer_id", organizer.id)
    .maybeSingle();
  return !!data;
}

// Adds a batch, or a run of them (every week or two) with the same price
// and seats. Dates that already have a batch on this trek are skipped.
export async function createBatch(_prev: FormState, formData: FormData): Promise<FormState> {
  const input = Object.fromEntries(formData);
  const parsed = batchSchema.safeParse(input);
  const repeat = repeatSchema.safeParse(input);
  if (!parsed.success) return fieldErrors(parsed.error);
  if (!repeat.success) return fieldErrors(repeat.error);
  if (parsed.data.start_date <= todayInIndia()) {
    return { error: "Please fix the highlighted fields.", fieldErrors: { start_date: "Pick a future date" } };
  }
  if (!(await ownsTrek(parsed.data.trek_id))) return { error: "Trek not found." };

  const days = REPEAT_OPTIONS.find((o) => o.value === repeat.data.repeat)?.days ?? 0;
  const dates = repeatDates(parsed.data.start_date, parsed.data.end_date, days, repeat.data.repeat_count ?? 1);

  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("batches")
    .select("start_date")
    .eq("trek_id", parsed.data.trek_id)
    .neq("status", "cancelled")
    .in(
      "start_date",
      dates.map((d) => d.start_date),
    );
  if (existingError) {
    console.error("createBatch lookup failed:", existingError);
    return { error: "Couldn't add the batch. Please try again." };
  }
  const taken = new Set(existing.map((b) => b.start_date));
  const rows = dates.filter((d) => !taken.has(d.start_date)).map((d) => ({ ...parsed.data, ...d }));
  if (!rows.length) {
    return { error: "There's already a batch on this trek starting on that date." };
  }

  const { error } = await supabase.from("batches").insert(rows);
  if (error) {
    console.error("createBatch failed:", error);
    return { error: "Couldn't add the batch. Please try again." };
  }

  refresh();
  const skipped = dates.length - rows.length;
  if (dates.length === 1) return { ok: true, message: "Batch added." };
  return {
    ok: true,
    message: `Added ${rows.length} batches.${skipped ? ` Skipped ${skipped} that already had a batch on that date.` : ""}`,
  };
}

export async function updateBatch(_prev: FormState, formData: FormData): Promise<FormState> {
  const batchId = formData.get("batch_id")?.toString() ?? "";
  const parsed = batchSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fieldErrors(parsed.error);

  const batch = await getOwnBatch(batchId);
  if (!batch) return { error: "Batch not found." };

  // Seats already booked or on hold can't be taken away.
  const seatsTaken = batch.total_seats - (batch.seats_left ?? 0);
  if (parsed.data.total_seats < seatsTaken) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: { total_seats: `${seatsTaken} seats are already booked` },
    };
  }

  // A batch stays on its trek, so trek_id isn't updated.
  const { start_date, end_date, price_paise, deposit_paise, total_seats } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("batches")
    .update({ start_date, end_date, price_paise, deposit_paise, total_seats })
    .eq("id", batch.id);
  if (error) {
    console.error("updateBatch failed:", error);
    return { error: "Couldn't save the batch. Please try again." };
  }

  if (total_seats > batch.total_seats) {
    const origin = await requestOrigin();
    after(() => notifyWaitlist(batch.id, origin));
  }
  refresh();
  return { ok: true };
}

export async function setBatchStatus(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = batchStatusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Something went wrong. Please refresh and try again." };

  const batch = await getOwnBatch(parsed.data.batch_id);
  if (!batch) return { error: "Batch not found." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("batches")
    .update({ status: parsed.data.status })
    .eq("id", batch.id);
  if (error) {
    console.error("setBatchStatus failed:", error);
    return { error: "Couldn't change the status. Please try again." };
  }

  if (parsed.data.status === "open") {
    const origin = await requestOrigin();
    after(() => notifyWaitlist(batch.id, origin));
  }
  refresh();
  return { ok: true };
}

export async function deleteBatch(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = batchIdSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Something went wrong. Please refresh and try again." };

  const batch = await getOwnBatch(parsed.data.batch_id);
  if (!batch) return { error: "Batch not found." };

  const supabase = await createClient();
  const { error } = await supabase.from("batches").delete().eq("id", batch.id);
  if (error?.code === FOREIGN_KEY_VIOLATION) {
    return { error: "This batch has bookings, so it can't be deleted. Cancel it instead." };
  }
  if (error) {
    console.error("deleteBatch failed:", error);
    return { error: "Couldn't delete the batch. Please try again." };
  }

  refresh();
  return { ok: true };
}
