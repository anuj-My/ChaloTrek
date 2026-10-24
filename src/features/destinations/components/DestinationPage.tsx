import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/shared/JsonLd";
import { Stars } from "@/components/shared/Stars";
import { VerifiedBadge } from "@/components/shared/VerifiedBadge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getTrekRatings } from "@/features/reviews/queries";
import { listPublicTreks } from "@/features/treks/queries";
import { formatDateRange, formatRupees } from "@/lib/format";
import { siteConfig } from "@/lib/site-config";

import { getDestination } from "../queries";

// One trek compared across organizers: who runs it, for how much, how it's
// rated, and every upcoming batch by date. The page people search for
// ("Kedarkantha trek price").
export async function DestinationPage({ params }: { params: Promise<{ destination: string }> }) {
  const { destination: slug } = await params;
  const destination = await getDestination(slug);
  if (!destination) notFound();

  const treks = await listPublicTreks(destination.id);
  const ratings = await getTrekRatings(treks.map((t) => t.id));
  const batches = treks
    .flatMap((trek) => trek.bookable.map((batch) => ({ ...batch, trek })))
    .sort((a, b) => a.start_date.localeCompare(b.start_date));
  const prices = batches.map((b) => b.price_paise);
  const organizerCount = new Set(treks.map((t) => t.organizers.slug)).size;

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10">
      <JsonLd
        data={{
          "@type": "ItemList",
          name: `${destination.name} trek organizers`,
          itemListElement: treks.map((trek, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${siteConfig.url}/o/${trek.organizers.slug}/${trek.slug}`,
            name: `${trek.name} by ${trek.organizers.name}`,
          })),
        }}
      />

      <header className="max-w-3xl space-y-3">
        <Link href="/treks" className="text-sm text-muted-foreground hover:text-foreground">
          ← All treks
        </Link>
        <h1 className="type-1">{destination.name} trek</h1>
        <p className="lead">
          {destination.region} ·{" "}
          {organizerCount === 0
            ? "No organizers listed yet"
            : `${organizerCount} ${organizerCount === 1 ? "organizer" : "organizers"}`}
          {prices.length > 0 &&
            ` · ${formatRupees(Math.min(...prices))}${
              Math.max(...prices) > Math.min(...prices) ? `–${formatRupees(Math.max(...prices))}` : ""
            } per person`}
          {batches.length > 0 && ` · ${batches.length} upcoming ${batches.length === 1 ? "batch" : "batches"}`}
        </p>
        {destination.summary && <p className="whitespace-pre-line">{destination.summary}</p>}
      </header>

      {treks.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="font-medium">No organizers list {destination.name} yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            <Link href="/treks" className="underline underline-offset-4">
              Explore other treks
            </Link>
          </p>
        </div>
      ) : (
        <>
          <section className="space-y-4">
            <h2 className="type-3">Compare organizers</h2>
            <ul className="divide-y rounded-xl border">
              {treks.map((trek) => {
                const rating = ratings.get(trek.id);
                return (
                  <li key={trek.id}>
                    <Link
                      href={`/o/${trek.organizers.slug}/${trek.slug}`}
                      className="flex gap-4 p-4 hover:bg-muted/50"
                    >
                      <div className="relative hidden aspect-[4/3] w-32 shrink-0 overflow-hidden rounded-lg bg-muted sm:block">
                        {trek.coverUrl && (
                          <Image src={trek.coverUrl} alt="" fill sizes="128px" className="object-cover" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="flex items-center gap-1.5 font-medium">
                            {trek.organizers.name}
                            {trek.organizers.verified_at && <VerifiedBadge label />}
                          </p>
                          {trek.fromPricePaise !== null ? (
                            <p className="text-sm">
                              <span className="text-muted-foreground">from </span>
                              <span className="font-semibold">{formatRupees(trek.fromPricePaise)}</span>
                            </p>
                          ) : (
                            <Badge variant="secondary">No open batches</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {trek.name} · {trek.duration_days} {trek.duration_days === 1 ? "day" : "days"} ·{" "}
                          <span className="capitalize">{trek.difficulty}</span>
                        </p>
                        {rating && (
                          <p className="flex items-center gap-1.5 text-sm">
                            <Stars rating={rating.average} />
                            <span className="text-muted-foreground">
                              {rating.average.toFixed(1)} ({rating.count})
                            </span>
                          </p>
                        )}
                        {trek.nextBatch && (
                          <p className="text-sm text-muted-foreground">
                            Next: {formatDateRange(trek.nextBatch.start_date, trek.nextBatch.end_date)}
                            {trek.bookableBatches > 1 && ` · ${trek.bookableBatches} batches open`}
                          </p>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          {batches.length > 0 && (
            <section className="space-y-4">
              <h2 className="type-3">Upcoming batches</h2>
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-muted-foreground">
                    <tr>
                      <th className="p-3 font-medium">Dates</th>
                      <th className="p-3 font-medium">Organizer</th>
                      <th className="p-3 font-medium">Price</th>
                      <th className="p-3 font-medium">Seats left</th>
                      <th className="p-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {batches.map((batch) => {
                      const seats = batch.seats_left ?? 0;
                      const trekPath = `/o/${batch.trek.organizers.slug}/${batch.trek.slug}`;
                      return (
                        <tr key={batch.id}>
                          <td className="p-3 whitespace-nowrap">{formatDateRange(batch.start_date, batch.end_date)}</td>
                          <td className="p-3">
                            <Link href={trekPath} className="underline-offset-4 hover:underline">
                              {batch.trek.organizers.name}
                            </Link>
                            {batch.trek.organizers.verified_at && <VerifiedBadge className="ml-1" />}
                          </td>
                          <td className="p-3 whitespace-nowrap">{formatRupees(batch.price_paise)}</td>
                          <td className={seats <= 5 ? "p-3 font-medium text-destructive" : "p-3"}>{seats}</td>
                          <td className="p-3 text-right">
                            <Link
                              href={`${trekPath}/book/${batch.id}`}
                              className={buttonVariants({ size: "sm" })}
                            >
                              Book
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
