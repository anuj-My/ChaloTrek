import "server-only";

import { notFound } from "next/navigation";

import { requireUser } from "@/features/auth/queries";
import { requireMyOrganizer } from "@/features/organizers/queries";
import { todayInIndia } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

import { bookingDisplayStatus } from "./status";

const INVALID_UUID = "22P02";

// A batch on a public trek, for the booking form. Null when the trek isn't
// public or the batch isn't on it. Whether it still takes bookings is up to
// the caller (status, seats_left, start date).
export async function getBatchForBooking(organizerSlug: string, trekSlug: string, batchId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("batches")
    .select(
      `id, start_date, end_date, price_paise, deposit_paise, status, seats_left,
       treks!inner(name, slug, status, cancellation_policies(name, description),
         organizers!inner(name, slug, kyc_status))`,
    )
    .eq("id", batchId)
    .eq("treks.slug", trekSlug)
    .eq("treks.status", "published")
    .eq("treks.organizers.slug", organizerSlug)
    .eq("treks.organizers.kyc_status", "approved")
    .maybeSingle();
  if (error?.code === INVALID_UUID) return null;
  if (error) throw error;
  return data;
}

export type BatchForBooking = NonNullable<Awaited<ReturnType<typeof getBatchForBooking>>>;

const BOOKING_WITH_TREK = `*, batches!inner(start_date, end_date, price_paise, deposit_paise, batch_group_links(url),
  treks!inner(name, slug, organizers!inner(name, slug, instagram_handle)))`;

// Bookings come back with `displayStatus`, worked out here at request time
// because it depends on the clock (see bookingDisplayStatus).

// One of the logged-in trekker's bookings. Organizers can read bookings on
// their treks through RLS, so filter by the trekker explicitly.
export async function getMyBooking(bookingId: string) {
  const user = await requireUser(`/my-bookings/${bookingId}`);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(`${BOOKING_WITH_TREK}, participants(full_name, age, gender, created_at)`)
    .eq("id", bookingId)
    .eq("user_id", user.id)
    .order("created_at", { referencedTable: "participants" })
    .maybeSingle();
  if (error?.code === INVALID_UUID) notFound();
  if (error) throw error;
  if (!data) notFound();
  return { ...data, displayStatus: bookingDisplayStatus(data, Date.now()) };
}

export type MyBooking = Awaited<ReturnType<typeof getMyBooking>>;

export async function listMyBookings() {
  const user = await requireUser("/my-bookings");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_WITH_TREK)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const now = Date.now();
  return data.map((booking) => ({ ...booking, displayStatus: bookingDisplayStatus(booking, now) }));
}

// ─── Organizer side ─────────────────────────────────────────────────────────
// RLS lets organizers read bookings and participants on their own treks only,
// but the batch lookups still filter by organizer explicitly, since anyone can
// read batches of public treks.

// Bookings that count: confirmed, or still holding seats while the trekker pays.
const isActive = (status: string) => status === "confirmed" || status === "held";

// The organizer's batches with booking totals, split into upcoming and past.
export async function listMyBatchBookingSummaries() {
  const organizer = await requireMyOrganizer();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("batches")
    .select(
      `id, start_date, end_date, total_seats, status, seats_left,
       treks!inner(name, organizer_id),
       bookings(num_people, status, hold_expires_at, paid_paise)`,
    )
    .eq("treks.organizer_id", organizer.id)
    .order("start_date");
  if (error) throw error;

  const now = Date.now();
  const today = todayInIndia();
  const batches = data.map(({ bookings, ...batch }) => {
    const statuses = bookings.map((b) => ({ ...b, displayStatus: bookingDisplayStatus(b, now) }));
    const peopleWith = (status: string) =>
      statuses.filter((b) => b.displayStatus === status).reduce((sum, b) => sum + b.num_people, 0);
    return {
      ...batch,
      confirmedPeople: peopleWith("confirmed"),
      heldPeople: peopleWith("held"),
      collectedPaise: statuses.filter((b) => b.displayStatus === "confirmed").reduce((sum, b) => sum + b.paid_paise, 0),
    };
  });
  return {
    upcoming: batches.filter((b) => b.end_date >= today),
    past: batches.filter((b) => b.end_date < today).reverse(),
  };
}

export type BatchBookingSummary = Awaited<ReturnType<typeof listMyBatchBookingSummaries>>["upcoming"][number];

// One of the organizer's batches with every booking and participant on it.
export async function getMyBatchBookings(batchId: string) {
  const organizer = await requireMyOrganizer();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("batches")
    .select(
      `id, start_date, end_date, total_seats, price_paise, deposit_paise, status, seats_left, batch_group_links(url),
       treks!inner(name, slug, organizer_id),
       bookings(*, participants(*))`,
    )
    .eq("id", batchId)
    .eq("treks.organizer_id", organizer.id)
    .order("created_at", { referencedTable: "bookings", ascending: false })
    .order("created_at", { referencedTable: "bookings.participants" })
    .maybeSingle();
  if (error?.code === INVALID_UUID) notFound();
  if (error) throw error;
  if (!data) notFound();

  const now = Date.now();
  const bookings = data.bookings.map((b) => ({ ...b, displayStatus: bookingDisplayStatus(b, now) }));
  return {
    ...data,
    activeBookings: bookings.filter((b) => isActive(b.displayStatus)),
    otherBookings: bookings.filter((b) => !isActive(b.displayStatus)),
  };
}

export type MyBatchBookings = Awaited<ReturnType<typeof getMyBatchBookings>>;
export type OrganizerBooking = MyBatchBookings["activeBookings"][number];
