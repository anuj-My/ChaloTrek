import { CheckCircle2Icon, CircleIcon } from "lucide-react";
import Link from "next/link";

import { getUser } from "@/features/auth/queries";
import { listMyBatchBookingSummaries } from "@/features/bookings/queries";
import { listMyTreks } from "@/features/treks/queries";
import { formatDateRange, formatRupees } from "@/lib/format";

import { getMyOrganizer, type MyOrganizer } from "../queries";
import { KycStatusBanner } from "./KycStatus";
import { OrganizerProfileForm } from "./OrganizerProfileForm";

export async function DashboardHome() {
  const organizer = await getMyOrganizer();

  if (!organizer) {
    const user = await getUser();
    return (
      <div className="max-w-xl space-y-6">
        <div className="space-y-1">
          <h1 className="type-2">Set up your organizer profile</h1>
          <p className="text-muted-foreground">
            This is what trekkers see on your booking pages. It takes a minute.
          </p>
        </div>
        <OrganizerProfileForm defaultEmail={user?.email} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="type-2">{organizer.name}</h1>
        <p className="text-sm text-muted-foreground">
          Your page, for your Instagram bio:{" "}
          <Link
            href={`/o/${organizer.slug}`}
            target="_blank"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            chalotrek.in/o/{organizer.slug}
          </Link>
          {organizer.kyc_status !== "approved" && " (goes live once your KYC is approved)"}
        </p>
      </div>
      <KycStatusBanner organizer={organizer} />
      <Overview organizer={organizer} />
    </div>
  );
}

// Getting-started steps until the first booking, then this season's numbers
// and the next few batches.
async function Overview({ organizer }: { organizer: MyOrganizer }) {
  const [{ treks }, { upcoming, past }] = await Promise.all([listMyTreks(), listMyBatchBookingSummaries()]);
  const hasBooking = [...upcoming, ...past].some((b) => b.confirmedPeople + b.heldPeople > 0);

  const steps = [
    { done: true, label: "Set up your profile", href: "/dashboard/settings" },
    {
      done: !!organizer.organizer_kyc?.submitted_at,
      label: "Submit your KYC (PAN and tourism registration)",
      href: "/dashboard/settings",
    },
    { done: treks.some((t) => t.status === "published"), label: "Add and publish a trek", href: "/dashboard/treks" },
    { done: upcoming.length > 0, label: "Add a batch with dates, price and seats", href: "/dashboard/batches" },
    { done: hasBooking, label: "Share your page in your Instagram bio and get your first booking", href: `/o/${organizer.slug}` },
  ];

  if (!hasBooking) {
    return (
      <section className="space-y-3 rounded-xl border p-5">
        <h2 className="type-4">Get your first booking</h2>
        <ol className="space-y-2">
          {steps.map((step) => (
            <li key={step.label} className="flex items-center gap-2 text-sm">
              {step.done ? (
                <CheckCircle2Icon className="size-5 shrink-0 text-success" aria-label="Done" />
              ) : (
                <CircleIcon className="size-5 shrink-0 text-muted-foreground" aria-label="To do" />
              )}
              {step.done ? (
                <span className="text-muted-foreground line-through">{step.label}</span>
              ) : (
                <Link href={step.href} className="underline-offset-4 hover:underline">
                  {step.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </section>
    );
  }

  const sum = (key: "confirmedPeople" | "heldPeople" | "collectedPaise") =>
    upcoming.reduce((total, b) => total + b[key], 0);
  const stats = [
    { label: "Upcoming batches", value: upcoming.length },
    { label: "Trekkers confirmed", value: sum("confirmedPeople") },
    { label: "Awaiting payment", value: sum("heldPeople") },
    { label: "Collected", value: formatRupees(sum("collectedPaise")) },
  ];

  return (
    <>
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border p-4">
            <dt className="text-sm text-muted-foreground">{stat.label}</dt>
            <dd className="mt-1 font-heading text-2xl tabular-nums">{stat.value}</dd>
          </div>
        ))}
      </dl>

      {upcoming.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="type-4">Next batches</h2>
            <Link href="/dashboard/bookings" className="text-sm underline underline-offset-4">
              All bookings
            </Link>
          </div>
          <ul className="divide-y rounded-lg border">
            {upcoming.slice(0, 5).map((batch) => {
              const filled = batch.total_seats - (batch.seats_left ?? 0);
              return (
                <li key={batch.id}>
                  <Link
                    href={`/dashboard/bookings/${batch.id}`}
                    className="flex flex-col gap-2 p-4 text-sm hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium">{batch.treks.name}</p>
                      <p className="text-muted-foreground">{formatDateRange(batch.start_date, batch.end_date)}</p>
                    </div>
                    <div className="space-y-1 sm:w-48">
                      <p className="text-muted-foreground sm:text-right">
                        {filled} of {batch.total_seats} seats filled
                      </p>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.min(100, (filled / batch.total_seats) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
}
