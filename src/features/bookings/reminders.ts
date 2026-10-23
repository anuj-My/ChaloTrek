import "server-only";

import { addDays, todayInIndia } from "@/lib/format";
import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/lib/supabase/admin";

import { emailBalanceReminder, emailReviewRequest, emailTrekReminder } from "./emails";
import { notifyWaitlist } from "./waitlist";

type EmailKind = Database["public"]["Enums"]["booking_email_kind"];

// When each email goes out, relative to the trek's dates (India time). The
// windows span several days so a missed run catches up the next day.
const BALANCE_REMINDER_DAYS_BEFORE = 5;
const TREK_REMINDER_DAYS_BEFORE = 2;
const REVIEW_REQUEST_WITHIN_DAYS = 7;

// The daily job, run by /api/cron/daily. Each email is sent once per booking:
// a row in booking_emails is claimed first, so a rerun or overlapping run
// skips bookings that already got it. Returns how many of each were sent.
export async function runDailyJobs(origin: string) {
  const admin = createAdminClient();
  const today = todayInIndia();

  // Confirmed bookings on batches starting or ending in a date range.
  async function confirmedBookings(column: "start_date" | "end_date", from: string, to: string) {
    const { data, error } = await admin
      .from("bookings")
      .select("id, total_paise, paid_paise, reviews(id), batches!inner(status)")
      .eq("status", "confirmed")
      .neq("batches.status", "cancelled")
      .gte(`batches.${column}`, from)
      .lte(`batches.${column}`, to);
    if (error) throw error;
    return data;
  }

  // Claims the email for these bookings and returns the ones not sent before.
  async function claim(kind: EmailKind, bookingIds: string[]) {
    if (bookingIds.length === 0) return [];
    const { data, error } = await admin
      .from("booking_emails")
      .upsert(
        bookingIds.map((booking_id) => ({ booking_id, kind })),
        { onConflict: "booking_id,kind", ignoreDuplicates: true },
      )
      .select("booking_id");
    if (error) throw error;
    return data.map((row) => row.booking_id);
  }

  // One at a time, to stay inside the email provider's rate limit.
  async function sendEach(ids: string[], email: (bookingId: string, origin: string) => Promise<void>) {
    for (const id of ids) await email(id, origin);
    return ids.length;
  }

  // Trek reminder before balance, so a trek that's two days away doesn't get
  // a separate balance email on top (its reminder includes the balance).
  const startingSoon = await confirmedBookings("start_date", addDays(today, 1), addDays(today, TREK_REMINDER_DAYS_BEFORE));
  const trekReminders = await sendEach(
    await claim("trek_reminder", startingSoon.map((b) => b.id)),
    emailTrekReminder,
  );

  const balanceDue = (
    await confirmedBookings(
      "start_date",
      addDays(today, TREK_REMINDER_DAYS_BEFORE + 1),
      addDays(today, BALANCE_REMINDER_DAYS_BEFORE),
    )
  ).filter((b) => b.paid_paise < b.total_paise);
  const balanceReminders = await sendEach(
    await claim("balance_reminder", balanceDue.map((b) => b.id)),
    emailBalanceReminder,
  );

  const ended = (
    await confirmedBookings("end_date", addDays(today, -REVIEW_REQUEST_WITHIN_DAYS), addDays(today, -1))
  ).filter((b) => !b.reviews);
  const reviewRequests = await sendEach(
    await claim("review_request", ended.map((b) => b.id)),
    emailReviewRequest,
  );

  // Seats freed by holds that ran out don't trigger anything when they
  // expire, so check every batch that has a waitlist. notifyWaitlist skips
  // batches that are still full and people emailed recently.
  const { data: waitlisted, error } = await admin.from("waitlist_entries").select("batch_id");
  if (error) throw error;
  const batchIds = [...new Set(waitlisted.map((e) => e.batch_id))];
  for (const batchId of batchIds) await notifyWaitlist(batchId, origin);

  return { trekReminders, balanceReminders, reviewRequests, waitlistsChecked: batchIds.length };
}
