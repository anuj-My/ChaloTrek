"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { getUser } from "@/features/auth/queries";
import { fieldErrors, type FormState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";

import { bookingFromFormData, bookingIdSchema, bookingSchema, offlinePaymentSchema } from "./schema";

// Messages raised by book_batch() that are safe and useful to show as-is.
const BOOKING_ERRORS = ["Not enough seats left", "This batch is not taking bookings", "Batch not found"];

// Holds the seats for 10 minutes and saves the participants, then sends the
// trekker to the booking page to pay. Payment confirms the booking later.
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
// database checks they run the trek and that seats are still free.
export async function recordOfflinePayment(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = offlinePaymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
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
// database decides who may, and the seats go back on sale.
export async function cancelBooking(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = bookingIdSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Something went wrong. Please refresh and try again." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_booking", { p_booking_id: parsed.data.booking_id });
  if (error) {
    const known = CANCEL_ERRORS.find((message) => error.message.includes(message));
    if (known) return { error: `${known}.` };
    console.error("cancelBooking failed:", error);
    return { error: "Couldn't cancel the booking. Please try again." };
  }

  refresh();
  return { ok: true };
}
