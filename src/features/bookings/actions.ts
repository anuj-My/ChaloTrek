"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";

import { getUser } from "@/features/auth/queries";
import { fieldErrors, type FormState } from "@/lib/form-state";
import { requestOrigin } from "@/lib/request-origin";
import { createClient } from "@/lib/supabase/server";

import { emailBookingCancelled, emailBookingConfirmed, emailNewBooking } from "./emails";
import {
  batchIdSchema,
  bookingFromFormData,
  bookingIdSchema,
  bookingSchema,
  groupLinkSchema,
  offlinePaymentSchema,
  waitlistEntryIdSchema,
  waitlistSchema,
} from "./schema";
import { notifyWaitlist } from "./waitlist";

// Messages raised by book_batch() that are safe and useful to show as-is.
const BOOKING_ERRORS = ["Not enough seats left", "This batch is not taking bookings", "Batch not found"];

// Holds the seats for 10 minutes and saves the participants, then sends the
// trekker to the booking page to pay, and emails the organizer. Payment
// confirms the booking later.
export async function startBooking(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) return { error: "Your session ended. Please log in again." };

  const parsed = bookingSchema.safeParse(bookingFromFormData(formData));
  if (!parsed.success) return fieldErrors(parsed.error);
  const { batch_id, contact_email, contact_phone, participants } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("book_batch", {
    p_batch_id: batch_id,
    p_contact_email: contact_email,
    p_contact_phone: contact_phone,
    p_participants: participants,
  });
  if (error) {
    const known = BOOKING_ERRORS.find((message) => error.message.includes(message));
    if (known === "Not enough seats left") {
      return { error: "Not enough seats left for that many people. Try fewer, or another batch." };
    }
    if (known) return { error: `${known}.` };
    console.error("startBooking failed:", error);
    return { error: "Couldn't start your booking. Please try again." };
  }

  // Booked, so they no longer need the waitlist for this batch.
  await supabase.from("waitlist_entries").delete().eq("batch_id", batch_id).eq("user_id", user.id);

  const origin = await requestOrigin();
  after(() => emailNewBooking(data.id, origin));
  redirect(`/my-bookings/${data.id}`);
}

// Messages raised by record_offline_payment() that are safe to show as-is.
const PAYMENT_ERRORS = [
  "Not enough seats left",
  "This booking was cancelled",
  "This batch was cancelled",
  "Amount must be between 1 and the booking total",
];

// Organizer marks a booking as paid (or updates what's been received). The
// database checks they run the trek and that seats are still free. The
// trekker is emailed when this confirms the booking, not on later updates.
export async function recordOfflinePayment(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = offlinePaymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
  const { data: before } = await supabase
    .from("bookings")
    .select("status")
    .eq("id", parsed.data.booking_id)
    .maybeSingle();
  const { error } = await supabase.rpc("record_offline_payment", {
    p_booking_id: parsed.data.booking_id,
    p_paid_paise: parsed.data.amount,
  });
  if (error) {
    const known = PAYMENT_ERRORS.find((message) => error.message.includes(message));
    if (known === "Not enough seats left") {
      return { error: "The seat hold ran out and the batch is now full, so this booking can't be confirmed." };
    }
    if (known?.startsWith("Amount")) return { error: "The amount can't be more than the booking total." };
    if (known) return { error: `${known}.` };
    console.error("recordOfflinePayment failed:", error);
    return { error: "Couldn't save the payment. Please try again." };
  }

  if (before?.status !== "confirmed") {
    const origin = await requestOrigin();
    after(() => emailBookingConfirmed(parsed.data.booking_id, origin));
  }
  refresh();
  return { ok: true };
}

// Messages raised by cancel_booking() that are safe to show as-is.
const CANCEL_ERRORS = [
  "This booking is not active",
  "Contact the organizer to cancel a paid booking",
  "Online payments must be refunded through Razorpay",
];

// The organizer, or the trekker for an unpaid booking, cancels it. The
// database decides who may, and the seats go back on sale. The trekker is
// emailed when the organizer cancels.
export async function cancelBooking(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = bookingIdSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Something went wrong. Please refresh and try again." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("cancel_booking", { p_booking_id: parsed.data.booking_id });
  if (error) {
    const known = CANCEL_ERRORS.find((message) => error.message.includes(message));
    if (known) return { error: `${known}.` };
    console.error("cancelBooking failed:", error);
    return { error: "Couldn't cancel the booking. Please try again." };
  }

  const origin = await requestOrigin();
  after(async () => {
    if (data.cancelled_by === "organizer") await emailBookingCancelled(data.id, origin);
    // The seats are free again.
    await notifyWaitlist(data.batch_id, origin);
  });
  refresh();
  return { ok: true };
}

// Trekker joins a full batch's waitlist, or changes how many people they're
// waiting for. RLS allows it only on open batches of public treks.
export async function joinWaitlist(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user?.email) return { error: "Your session ended. Please log in again." };

  const parsed = waitlistSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Something went wrong. Please refresh and try again." };
  const { batch_id, num_people } = parsed.data;

  const supabase = await createClient();
  const { data: batch } = await supabase.from("batches").select("seats_left").eq("id", batch_id).maybeSingle();
  if ((batch?.seats_left ?? 0) >= num_people) {
    return { error: "Seats just opened up. Refresh the page to book." };
  }

  const { error } = await supabase
    .from("waitlist_entries")
    .upsert(
      { batch_id, user_id: user.id, email: user.email, num_people, notified_at: null },
      { onConflict: "batch_id,user_id" },
    );
  if (error) {
    console.error("joinWaitlist failed:", error);
    return { error: "Couldn't join the waitlist. This batch may have closed." };
  }

  refresh();
  return { ok: true };
}

// Trekker leaves a waitlist they joined.
export async function leaveWaitlist(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) return { error: "Your session ended. Please log in again." };

  const parsed = batchIdSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Something went wrong. Please refresh and try again." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("waitlist_entries")
    .delete()
    .eq("batch_id", parsed.data.batch_id)
    .eq("user_id", user.id);
  if (error) {
    console.error("leaveWaitlist failed:", error);
    return { error: "Couldn't leave the waitlist. Please try again." };
  }

  refresh();
  return { ok: true };
}

// Organizer removes someone from their batch's waitlist. RLS checks they run it.
export async function removeWaitlistEntry(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = waitlistEntryIdSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Something went wrong. Please refresh and try again." };

  const supabase = await createClient();
  const { error } = await supabase.from("waitlist_entries").delete().eq("id", parsed.data.entry_id);
  if (error) {
    console.error("removeWaitlistEntry failed:", error);
    return { error: "Couldn't remove them. Please try again." };
  }

  refresh();
  return { ok: true };
}

// Organizer sets, changes or removes a batch's WhatsApp group link. RLS lets
// only the batch's organizer write it.
export async function saveGroupLink(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = groupLinkSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fieldErrors(parsed.error);
  const { batch_id, url } = parsed.data;

  const supabase = await createClient();
  const { error } = url
    ? await supabase.from("batch_group_links").upsert({ batch_id, url })
    : await supabase.from("batch_group_links").delete().eq("batch_id", batch_id);
  if (error) {
    console.error("saveGroupLink failed:", error);
    return { error: "Couldn't save the link. Please try again." };
  }

  refresh();
  return { ok: true };
}
