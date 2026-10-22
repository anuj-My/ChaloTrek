"use server";

import { redirect } from "next/navigation";

import { getUser } from "@/features/auth/queries";
import { fieldErrors, type FormState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";

import { bookingFromFormData, bookingSchema } from "./schema";

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
