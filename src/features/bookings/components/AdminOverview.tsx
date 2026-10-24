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
      <h1 className="type-2">Overview</h1>

      {stats.organizers.awaitingReview > 0 && (
        <Link
          href="/admin/organizers"
          className="block rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-warning hover:bg-warning/15"
        >
          {stats.organizers.awaitingReview} {stats.organizers.awaitingReview === 1 ? "organizer is" : "organizers are"}{" "}
          waiting for KYC review →
        </Link>
      )}

      {groups.map((group) => (
        <section key={group.title} className="space-y-3">
          <h2 className="type-4">{group.title}</h2>
          <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {group.items.map((item) => (
              <div key={item.label} className="rounded-lg border p-4">
                <dt className="text-sm text-muted-foreground">{item.label}</dt>
                <dd className="mt-1 font-heading text-2xl tabular-nums">{item.value}</dd>
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
