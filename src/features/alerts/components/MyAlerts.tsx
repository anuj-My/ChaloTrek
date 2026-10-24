import Link from "next/link";

import { ActionButton } from "@/components/shared/ActionButton";
import { formatDate } from "@/lib/format";

import { stopAlert } from "../actions";
import { listMyAlerts } from "../queries";

// The treks and destinations a trekker follows for new batches.
export async function MyAlerts() {
  const alerts = await listMyAlerts();

  return (
    <div className="max-w-2xl space-y-6">
      <div className="space-y-1">
        <Link href="/my-bookings" className="text-sm text-muted-foreground hover:text-foreground">
          ← My bookings
        </Link>
        <h1 className="type-2">Batch alerts</h1>
        <p className="text-muted-foreground">We email you when these get new batches.</p>
      </div>

      {alerts.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="font-medium">No alerts yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap &ldquo;Notify me about new batches&rdquo; on a trek or on a{" "}
            <Link href="/treks" className="underline underline-offset-4">
              destination
            </Link>{" "}
            page.
          </p>
        </div>
      ) : (
        <ul className="divide-y rounded-lg border">
          {alerts.map((alert) => {
            const trek = alert.treks;
            const destination = alert.destinations;
            const href = trek
              ? `/o/${trek.organizers?.slug}/${trek.slug}`
              : destination && `/treks/${destination.slug}`;
            const label = trek
              ? `${trek.name} by ${trek.organizers?.name}`
              : destination && `${destination.name}, every organizer`;
            return (
              <li key={alert.id} className="flex items-center justify-between gap-3 p-4 text-sm">
                <div className="space-y-0.5">
                  {href ? (
                    <Link href={href} className="font-medium hover:underline">
                      {label}
                    </Link>
                  ) : (
                    <span className="font-medium">A trek that&apos;s no longer listed</span>
                  )}
                  <p className="text-muted-foreground">Since {formatDate(alert.created_at.slice(0, 10))}</p>
                </div>
                <ActionButton action={stopAlert} fields={{ alert_id: alert.id }} variant="ghost">
                  Turn off
                </ActionButton>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
