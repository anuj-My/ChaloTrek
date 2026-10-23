import Link from "next/link";

import { formatRupees } from "@/lib/format";

import { getPlatformStats } from "../queries";

// Admin home: the numbers to watch (docs/plan.md, section 10).
export async function AdminOverview() {
  const stats = await getPlatformStats();

  const groups = [
    {
      title: "This month",
      items: [
        { label: "Confirmed bookings", value: stats.month.bookings },
        { label: "Trekkers", value: stats.month.people },
        { label: "Booking value", value: formatRupees(stats.month.gmvPaise) },
      ],
    },
    {
      title: "All time",
      items: [
        { label: "Confirmed bookings", value: stats.allTime.bookings },
        { label: "Trekkers", value: stats.allTime.people },
        { label: "Booking value", value: formatRupees(stats.allTime.gmvPaise) },
        { label: "Collected", value: formatRupees(stats.allTime.collectedPaise) },
      ],
    },
    {
      title: "Organizers",
      items: [
        { label: "Signed up", value: stats.organizers.total },
        { label: "Approved", value: stats.organizers.approved },
        { label: "Open batches", value: stats.openBatches },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      <h1 className="font-heading text-2xl font-semibold">Overview</h1>

      {stats.organizers.awaitingReview > 0 && (
        <Link
          href="/admin/organizers"
          className="block rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
        >
          {stats.organizers.awaitingReview} {stats.organizers.awaitingReview === 1 ? "organizer is" : "organizers are"}{" "}
          waiting for KYC review →
        </Link>
      )}

      {groups.map((group) => (
        <section key={group.title} className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">{group.title}</h2>
          <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {group.items.map((item) => (
              <div key={item.label} className="rounded-lg border p-4">
                <dt className="text-sm text-muted-foreground">{item.label}</dt>
                <dd className="mt-1 text-xl font-semibold">{item.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}

      <p className="text-sm text-muted-foreground">
        Booking value is the full price of confirmed bookings; collected is what trekkers have paid so far, online or
        to the organizer.
      </p>
    </div>
  );
}
