// Dummy organizers, treks and batches for testing. Uses the secret key, so
// it bypasses RLS: run it against the dev project only.
//
//   npm run db:seed-dummy           add dummy data (removes the old first)
//   npm run db:seed-dummy -- --clean  remove dummy data only
//
// Dummy data is marked so it can be removed: dummy organizers have slugs
// starting "dummy-" (with test logins @example.com), and every dummy trek's
// summary starts with "[Dummy]". Two treks also go on the first approved
// real organizer (e.g. your own test account), for testing the dashboard.
// Every batch starts more than 3 months from today.

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local");
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const MARK = "[Dummy]";
const FIRST_BATCH_DAYS_AHEAD = 100;

const check = ({ data, error }) => {
  if (error) throw error;
  return data;
};

// "YYYY-MM-DD", n days from today.
function inDays(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const DUMMY_ORGANIZERS = [
  {
    slug: "dummy-himalayan-hikers",
    name: "Himalayan Hikers (Dummy)",
    bio: "Dummy organizer for testing. Small groups, local guides from Uttarkashi.",
    instagram_handle: "dummy_himalayan_hikers",
    phone: "+91 90000 00001",
    email: "dummy-organizer-1@example.com",
  },
  {
    slug: "dummy-mountain-trails",
    name: "Mountain Trails Co (Dummy)",
    bio: "Dummy organizer for testing. Weekend and week-long treks in Himachal and Uttarakhand.",
    instagram_handle: "dummy_mountain_trails",
    phone: "+91 90000 00002",
    email: "dummy-organizer-2@example.com",
  },
];

// destination: slug in public.destinations. batches: [days after the first
// batch date, price ₹, deposit ₹ or null, seats].
const TREKS = {
  "dummy-himalayan-hikers": [
    {
      slug: "kedarkantha",
      name: "Kedarkantha Summit Trek",
      destination: "kedarkantha",
      region: "Uttarakhand",
      difficulty: "moderate",
      duration_days: 6,
      max_altitude_m: 3810,
      policy: 1,
      batches: [[0, 8500, 2000, 20], [14, 8500, 2000, 20], [35, 9500, null, 16]],
    },
    {
      slug: "brahmatal",
      name: "Brahmatal Trek",
      destination: "brahmatal",
      region: "Uttarakhand",
      difficulty: "moderate",
      duration_days: 6,
      max_altitude_m: 3734,
      policy: 2,
      batches: [[7, 9200, 2500, 18], [28, 9200, 2500, 18]],
    },
    {
      slug: "kashmir-great-lakes",
      name: "Kashmir Great Lakes",
      destination: "kashmir-great-lakes",
      region: "Jammu & Kashmir",
      difficulty: "difficult",
      duration_days: 8,
      max_altitude_m: 4200,
      policy: 3,
      batches: [[150, 18500, 5000, 15], [164, 18500, 5000, 15]],
    },
  ],
  "dummy-mountain-trails": [
    {
      slug: "kedarkantha-winter",
      name: "Kedarkantha Winter Trek",
      destination: "kedarkantha",
      region: "Uttarakhand",
      difficulty: "moderate",
      duration_days: 5,
      max_altitude_m: 3810,
      policy: 2,
      batches: [[3, 7200, null, 24], [10, 7200, null, 24], [24, 7900, 1500, 24]],
    },
    {
      slug: "hampta-pass",
      name: "Hampta Pass Crossover",
      destination: "hampta-pass",
      region: "Himachal Pradesh",
      difficulty: "moderate",
      duration_days: 5,
      max_altitude_m: 4270,
      policy: 1,
      batches: [[120, 11500, 3000, 20], [134, 11500, 3000, 20]],
    },
    {
      slug: "triund",
      name: "Triund Weekend Trek",
      destination: "triund",
      region: "Himachal Pradesh",
      difficulty: "easy",
      duration_days: 2,
      max_altitude_m: 2850,
      policy: 1,
      batches: [[5, 2500, null, 30], [12, 2500, null, 30], [19, 2500, null, 4]],
    },
  ],
  // On the first real approved organizer.
  real: [
    {
      slug: "dummy-dayara-bugyal",
      name: "Dayara Bugyal Trek",
      destination: "dayara-bugyal",
      region: "Uttarakhand",
      difficulty: "easy",
      duration_days: 5,
      max_altitude_m: 3639,
      policy: 1,
      batches: [[2, 7800, 2000, 16], [21, 7800, 2000, 16]],
    },
    {
      slug: "dummy-hampta-pass",
      name: "Hampta Pass Trek",
      destination: "hampta-pass",
      region: "Himachal Pradesh",
      difficulty: "moderate",
      duration_days: 5,
      max_altitude_m: 4270,
      policy: 2,
      batches: [[127, 12500, 3000, 12]],
    },
  ],
};

function trekRow(organizerId, trek, destinations) {
  const days = trek.duration_days;
  return {
    organizer_id: organizerId,
    slug: trek.slug,
    name: trek.name,
    region: trek.region,
    difficulty: trek.difficulty,
    duration_days: days,
    max_altitude_m: trek.max_altitude_m,
    summary: `${MARK} Test trek for trying out bookings. ${days} days in ${trek.region}, up to ${trek.max_altitude_m.toLocaleString("en-IN")} m.`,
    itinerary: Array.from({ length: days }, (_, i) => ({
      title:
        i === 0 ? "Arrive at the base village" : i === days - 1 ? "Trek down and drive back" : `Trek day ${i}`,
      description: i === 0 ? "Pickup from Dehradun at 7 am. Briefing and gear check in the evening." : "",
    })),
    inclusions: ["Stay in tents and guesthouses", "All meals on the trek", "Certified trek leader", "Permits"],
    exclusions: ["Travel to the pickup point", "Personal gear", "Porter for personal bags"],
    cancellation_policy_id: trek.policy,
    destination_id: destinations.get(trek.destination) ?? null,
    status: "published",
  };
}

async function clean() {
  const organizers = check(await db.from("organizers").select("id, owner_user_id, slug").like("slug", "dummy-%"));
  const dummyTreks = check(await db.from("treks").select("id").like("summary", `${MARK}%`));
  const trekIds = dummyTreks.map((t) => t.id);
  if (trekIds.length) {
    const batchIds = check(await db.from("batches").select("id").in("trek_id", trekIds)).map((b) => b.id);
    // Bookings block deleting batches (on delete restrict), so remove test bookings first.
    if (batchIds.length) check(await db.from("bookings").delete().in("batch_id", batchIds));
    check(await db.from("treks").delete().in("id", trekIds));
  }
  if (organizers.length) {
    check(await db.from("organizers").delete().in("id", organizers.map((o) => o.id)));
    for (const o of organizers) check(await db.auth.admin.deleteUser(o.owner_user_id));
  }
  console.log(`Removed ${trekIds.length} dummy treks and ${organizers.length} dummy organizers.`);
}

async function seed() {
  const destinations = new Map(check(await db.from("destinations").select("id, slug")).map((d) => [d.slug, d.id]));
  const firstDate = FIRST_BATCH_DAYS_AHEAD;
  let trekCount = 0;
  let batchCount = 0;

  async function addTreks(organizerId, treks) {
    for (const trek of treks) {
      const row = check(await db.from("treks").insert(trekRow(organizerId, trek, destinations)).select("id").single());
      const batches = trek.batches.map(([offset, price, deposit, seats]) => ({
        trek_id: row.id,
        start_date: inDays(firstDate + offset),
        end_date: inDays(firstDate + offset + trek.duration_days - 1),
        price_paise: price * 100,
        deposit_paise: deposit ? deposit * 100 : null,
        total_seats: seats,
      }));
      check(await db.from("batches").insert(batches));
      trekCount++;
      batchCount += batches.length;
    }
  }

  for (const organizer of DUMMY_ORGANIZERS) {
    const { user } = check(
      await db.auth.admin.createUser({ email: organizer.email, email_confirm: true }),
    );
    const row = check(
      await db
        .from("organizers")
        .insert({ ...organizer, owner_user_id: user.id, kyc_status: "approved" })
        .select("id")
        .single(),
    );
    await addTreks(row.id, TREKS[organizer.slug]);
  }

  const real = check(
    await db
      .from("organizers")
      .select("id, slug")
      .eq("kyc_status", "approved")
      .not("slug", "like", "dummy-%")
      .order("created_at")
      .limit(1),
  )[0];
  if (real) await addTreks(real.id, TREKS.real);

  console.log(
    `Added ${DUMMY_ORGANIZERS.length} dummy organizers, ${trekCount} treks and ${batchCount} batches` +
      `${real ? ` (2 treks on /o/${real.slug})` : ""}. First batch starts ${inDays(firstDate)}.`,
  );
}

await clean();
if (!process.argv.includes("--clean")) await seed();
