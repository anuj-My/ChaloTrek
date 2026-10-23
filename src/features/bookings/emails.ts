import "server-only";

import { type EmailContent, sendEmail } from "@/lib/email";
import { formatDateRange, formatRupees } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";

import { amountDueNowPaise, bookingReference } from "./status";

// Booking emails. Called from actions through after(), once the database has
// already accepted the change, so they read with the admin client: the
// trekker can't read the organizer's email, and vice versa.
// `origin` is the site the action ran on, so links work in dev too.

async function getBookingForEmail(bookingId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("bookings")
    .select(
      `id, booking_number, batch_id, contact_email, contact_phone, num_people, total_paise, paid_paise,
       batches!inner(start_date, end_date, price_paise, deposit_paise,
         treks!inner(name, organizers!inner(name, email, phone, instagram_handle, owner_user_id))),
       participants(full_name)`,
    )
    .eq("id", bookingId)
    .order("created_at", { referencedTable: "participants" })
    .single();
  if (error) throw error;

  const batch = data.batches;
  const organizer = batch.treks.organizers;
  return {
    ...data,
    batch,
    trekName: batch.treks.name,
    organizer,
    reference: bookingReference(data.booking_number),
    dates: formatDateRange(batch.start_date, batch.end_date),
    names: data.participants.map((p) => p.full_name).join("\n"),
  };
}

type BookingForEmail = Awaited<ReturnType<typeof getBookingForEmail>>;

// The organizer's contact email, or the email they log in with.
async function organizerEmail(organizer: BookingForEmail["organizer"]) {
  if (organizer.email) return organizer.email;
  const { data, error } = await createAdminClient().auth.admin.getUserById(organizer.owner_user_id);
  if (error) throw error;
  return data.user.email ?? null;
}

const people = (n: number) => `${n} ${n === 1 ? "person" : "people"}`;

// How the trekker can reach the organizer, e.g. "+91 98765 43210 · @himalayan_hikers on Instagram".
function organizerContact(organizer: BookingForEmail["organizer"]) {
  return [organizer.phone, organizer.instagram_handle && `@${organizer.instagram_handle} on Instagram`]
    .filter(Boolean)
    .join(" · ");
}

async function send(bookingId: string, what: string, compose: (b: BookingForEmail) => Promise<void>) {
  try {
    await compose(await getBookingForEmail(bookingId));
  } catch (error) {
    console.error(`Couldn't send the ${what} email for booking ${bookingId}:`, error);
  }
}

// To the organizer, when a trekker holds seats.
export function emailNewBooking(bookingId: string, origin: string) {
  return send(bookingId, "new booking", async (b) => {
    const to = await organizerEmail(b.organizer);
    if (!to) return;
    const content: EmailContent = {
      heading: `New booking on ${b.trekName}`,
      paragraphs: [
        `${b.participants[0]?.full_name ?? "A trekker"} is holding ${people(b.num_people)} on your ${b.dates} batch. The seats are held for 10 minutes.`,
        "Online payment isn't live yet, so they may message you to pay. Once you've received the money, mark the booking as paid in your dashboard to confirm it.",
      ],
      rows: [
        ["Booking ID", b.reference],
        ["Batch", `${b.trekName}, ${b.dates}`],
        ["People", b.names],
        ["Contact", `${b.contact_email}\n${b.contact_phone}`],
        ["Total", formatRupees(b.total_paise)],
        ["Due now", formatRupees(amountDueNowPaise(b.batch, b.num_people))],
      ],
      button: { label: "View bookings", url: `${origin}/dashboard/bookings/${b.batch_id}` },
    };
    await sendEmail({
      to,
      subject: `New booking ${b.reference}: ${b.trekName}, ${b.dates}`,
      replyTo: b.contact_email,
      content,
    });
  });
}

// To the trekker, when their booking is confirmed.
export function emailBookingConfirmed(bookingId: string, origin: string) {
  return send(bookingId, "booking confirmed", async (b) => {
    const balance = b.total_paise - b.paid_paise;
    const contact = organizerContact(b.organizer);
    const content: EmailContent = {
      heading: "Your booking is confirmed",
      paragraphs: [
        `You're going on ${b.trekName} with ${b.organizer.name}. Keep your booking ID handy.`,
        ...(contact ? [`Questions about the trek? Contact ${b.organizer.name}: ${contact}.`] : []),
      ],
      rows: [
        ["Booking ID", b.reference],
        ["Trek", b.trekName],
        ["Dates", b.dates],
        ["Organizer", b.organizer.name],
        ["People", b.names],
        ["Total", formatRupees(b.total_paise)],
        ["Paid", formatRupees(b.paid_paise)],
        ...(balance > 0 ? [["Balance, paid to the organizer", formatRupees(balance)] as [string, string]] : []),
      ],
      button: { label: "View booking", url: `${origin}/my-bookings/${b.id}` },
    };
    await sendEmail({
      to: b.contact_email,
      subject: `Booking confirmed: ${b.trekName}, ${b.dates} (${b.reference})`,
      replyTo: b.organizer.email,
      content,
    });
  });
}

// To the trekker, when the organizer cancels their booking.
export function emailBookingCancelled(bookingId: string, origin: string) {
  return send(bookingId, "booking cancelled", async (b) => {
    const contact = organizerContact(b.organizer);
    const content: EmailContent = {
      heading: "Your booking was cancelled",
      paragraphs: [
        `${b.organizer.name} cancelled your booking for ${b.trekName} (${b.dates}).`,
        b.paid_paise > 0
          ? `Contact them about refunding the ${formatRupees(b.paid_paise)} you paid${contact ? `: ${contact}` : ""}.`
          : `If you think this is a mistake, contact them${contact ? `: ${contact}` : ""}.`,
      ],
      rows: [
        ["Booking ID", b.reference],
        ["Trek", b.trekName],
        ["Dates", b.dates],
      ],
      button: { label: "View booking", url: `${origin}/my-bookings/${b.id}` },
    };
    await sendEmail({
      to: b.contact_email,
      subject: `Booking cancelled: ${b.trekName}, ${b.dates} (${b.reference})`,
      replyTo: b.organizer.email,
      content,
    });
  });
}
