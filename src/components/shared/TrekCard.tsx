import Image from "next/image";
import Link from "next/link";

import { formatDateRange, formatRupees } from "@/lib/format";

import { VerifiedBadge } from "./VerifiedBadge";

export type TrekCardData = {
  name: string;
  region: string;
  difficulty: string;
  duration_days: number;
  max_altitude_m: number | null;
  coverUrl: string | null;
  nextBatch: { start_date: string; end_date: string } | null;
  bookableBatches: number;
  fromPricePaise: number | null;
};

// A trek in a grid: cover photo, starting price, key facts and next batch.
// `organizer` is shown where treks from several organizers are mixed.
export function TrekCard({
  trek,
  href,
  organizer,
}: {
  trek: TrekCardData;
  href: string;
  organizer?: { name: string; verified_at: string | null };
}) {
  const facts = [
    trek.region,
    `${trek.duration_days} ${trek.duration_days === 1 ? "day" : "days"}`,
    trek.max_altitude_m && `${trek.max_altitude_m.toLocaleString("en-IN")} m`,
  ].filter(Boolean);
  const next = trek.nextBatch;

  return (
    <Link href={href} className="group block space-y-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
        {trek.coverUrl && (
          <Image
            src={trek.coverUrl}
            alt={trek.name}
            fill
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        )}
      </div>
      <div className="space-y-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="type-4 group-hover:underline group-hover:underline-offset-4">{trek.name}</h3>
          {trek.fromPricePaise !== null && (
            <p className="shrink-0 text-sm">
              <span className="text-muted-foreground">from </span>
              <span className="font-medium tabular-nums">{formatRupees(trek.fromPricePaise)}</span>
            </p>
          )}
        </div>
        {organizer && (
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            by {organizer.name}
            {organizer.verified_at && <VerifiedBadge />}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          {facts.join(" · ")} · <span className="capitalize">{trek.difficulty}</span>
        </p>
        <p className="text-sm">
          {next ? (
            <>
              Next: {formatDateRange(next.start_date, next.end_date)}
              {trek.bookableBatches > 1 && (
                <span className="text-muted-foreground"> · +{trek.bookableBatches - 1} more</span>
              )}
            </>
          ) : (
            <span className="text-muted-foreground">No upcoming batches</span>
          )}
        </p>
      </div>
    </Link>
  );
}
