import "server-only";

import { notFound } from "next/navigation";

import { requireAdmin, requireUser } from "@/features/auth/queries";
import { awaitingReview, requireMyOrganizer } from "@/features/organizers/queries";
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
    .select(
      `${BOOKING_WITH_TREK}, participants(full_name, age, gender, created_at),
       reviews(rating, body, author_name, hidden)`,
    )
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
    .select(`${BOOKING_WITH_TREK}, reviews(id)`)
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
       bookings(*, participants(*), coupons(code)),
       waitlist_entries(id, email, num_people, notified_at, created_at)`,
    )
    .eq("id", batchId)
    .eq("treks.organizer_id", organizer.id)
    .order("created_at", { referencedTable: "bookings", ascending: false })
    .order("created_at", { referencedTable: "bookings.participants" })
    .order("created_at", { referencedTable: "waitlist_entries" })
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

// The logged-in trekker's place on a batch's waitlist, or null.
export async function getMyWaitlistEntry(batchId: string, userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("waitlist_entries")
    .select("num_people, email, notified_at")
    .eq("batch_id", batchId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ─── Admin ──────────────────────────────────────────────────────────────────
// Admins read every booking through RLS (is_admin()).

// The most recent bookings across the platform.
export async function listAllBookings(limit = 200) {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(
      `id, booking_number, status, hold_expires_at, num_people, total_paise, paid_paise, paid_offline,
       contact_email, contact_phone, created_at,
       batches!inner(start_date, end_date, treks!inner(name, slug, organizers!inner(name, slug)))`,
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  const now = Date.now();
  return data.map((booking) => ({ ...booking, displayStatus: bookingDisplayStatus(booking, now) }));
}

// Headline numbers for the admin overview (docs/plan.md, section 10). Reads
// every booking, which is fine until there are tens of thousands.
export async function getPlatformStats() {
  await requireAdmin();
  const supabase = await createClient();
  const today = todayInIndia();
  const [organizers, bookings, batches] = await Promise.all([
    supabase.from("organizers").select("kyc_status, organizer_kyc(submitted_at, reviewed_at)"),
    supabase.from("bookings").select("status, hold_expires_at, num_people, total_paise, paid_paise, created_at"),
    supabase
      .from("batches")
      .select("id", { count: "exact", head: true })
      .eq("status", "open")
      .gt("start_date", today),
  ]);
  for (const result of [organizers, bookings, batches]) if (result.error) throw result.error;

  // Bookings made this calendar month, India time.
  const monthStart = `${today.slice(0, 7)}-01T00:00:00+05:30`;
  const now = Date.now();
  const confirmed = (bookings.data ?? []).filter((b) => bookingDisplayStatus(b, now) === "confirmed");
  const thisMonth = confirmed.filter((b) => b.created_at >= new Date(monthStart).toISOString());
  const sum = (rows: typeof confirmed, key: "total_paise" | "paid_paise" | "num_people") =>
    rows.reduce((total, b) => total + b[key], 0);
  const orgs = organizers.data ?? [];

  return {
    organizers: {
      total: orgs.length,
      approved: orgs.filter((o) => o.kyc_status === "approved").length,
      awaitingReview: orgs.filter((o) => o.kyc_status !== "approved" && awaitingReview(o.organizer_kyc)).length,
    },
    openBatches: batches.count ?? 0,
    month: { bookings: thisMonth.length, people: sum(thisMonth, "num_people"), gmvPaise: sum(thisMonth, "total_paise") },
    allTime: {
      bookings: confirmed.length,
      people: sum(confirmed, "num_people"),
      gmvPaise: sum(confirmed, "total_paise"),
      collectedPaise: sum(confirmed, "paid_paise"),
    },
  };
}
