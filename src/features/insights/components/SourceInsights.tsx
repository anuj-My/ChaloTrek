import { formatRupees } from "@/lib/format";
import { MARKETPLACE_TAG } from "@/lib/source-tag";

import { getSourceInsights, INSIGHTS_DAYS, type SourceRow } from "../queries";
import { TrackedLinkBuilder } from "./TrackedLinkBuilder";

function tagLabel(tag: string) {
  if (tag === MARKETPLACE_TAG) return "Chalo Trek (explore and trek pages)";
  if (!tag) return "No tag";
  return tag;
}

// Confirmed bookings per trek page view, as a percentage.
function conversion(row: SourceRow) {
  if (!row.views) return "—";
  return `${((row.confirmed / row.views) * 100).toFixed(1)}%`;
}

// Which links bring visitors and bookings, so organizers know where to post.
export async function SourceInsights() {
  const { organizerSlug, rows, total } = await getSourceInsights();

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h1 className="type-2">Insights</h1>
        <p className="text-muted-foreground">
          Where your visitors and bookings came from in the last {INSIGHTS_DAYS} days.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="type-4">By source</h2>
        {rows.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="font-medium">No visits yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Make a tracked link below and share it. Visits to your trek pages show up here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th className="p-3 font-medium">Source</th>
                  <th className="p-3 text-right font-medium">Trek page views</th>
                  <th className="p-3 text-right font-medium">Bookings started</th>
                  <th className="p-3 text-right font-medium">Confirmed</th>
                  <th className="p-3 text-right font-medium">Views → confirmed</th>
                  <th className="p-3 text-right font-medium">Confirmed value</th>
                </tr>
              </thead>
              <tbody className="divide-y tabular-nums">
                {rows.map((row) => (
                  <SourceTableRow key={row.tag} label={tagLabel(row.tag)} row={row} />
                ))}
                {rows.length > 1 && <SourceTableRow label="Total" row={total} className="font-medium" />}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          A visitor keeps the tag of the last link they used for 30 days, so a booking made a few days later still
          counts for it. &ldquo;No tag&rdquo; is people who came from an untagged link or typed your address. Your own
          visits aren&apos;t counted.
        </p>
      </section>

      <section className="space-y-3">
        <div className="space-y-1">
          <h2 className="type-4">Make a tracked link</h2>
          <p className="text-sm text-muted-foreground">
            Use a different tag for each place you share, like your Instagram bio, a story or a WhatsApp group.
          </p>
        </div>
        <TrackedLinkBuilder organizerSlug={organizerSlug} />
      </section>
    </div>
  );
}

function SourceTableRow({ label, row, className }: { label: string; row: SourceRow; className?: string }) {
  return (
    <tr className={className}>
      <td className="p-3 whitespace-nowrap">{label}</td>
      <td className="p-3 text-right">{row.views}</td>
      <td className="p-3 text-right">{row.bookings}</td>
      <td className="p-3 text-right">{row.confirmed}</td>
      <td className="p-3 text-right">{conversion(row)}</td>
      <td className="p-3 text-right whitespace-nowrap">{formatRupees(row.confirmedPaise)}</td>
    </tr>
  );
}
