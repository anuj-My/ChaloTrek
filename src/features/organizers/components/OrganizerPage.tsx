import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getPublicOrganizerTreks, type PublicOrganizerTrek } from "@/features/treks/queries";
import { formatDateRange, formatRupees } from "@/lib/format";

// The organizer's public page, the one link for their Instagram bio: who they
// are and every live trek with its next batch.
export async function OrganizerPage({ params }: { params: Promise<{ organizer: string }> }) {
  const { organizer: slug } = await params;
  const organizer = await getPublicOrganizerTreks(slug);
  if (!organizer) notFound();

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10">
      <header className="max-w-2xl space-y-3">
        <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">{organizer.name}</h1>
        {organizer.bio && <p className="text-lg whitespace-pre-line text-muted-foreground">{organizer.bio}</p>}
        {organizer.instagram_handle && (
          <a
            href={`https://instagram.com/${organizer.instagram_handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sm underline underline-offset-4"
          >
            @{organizer.instagram_handle} on Instagram
          </a>
        )}
      </header>

      <section className="space-y-4">
        <h2 className="font-heading text-xl font-semibold">Treks</h2>
        {organizer.treks.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="font-medium">No treks listed yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Check back soon.</p>
          </div>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {organizer.treks.map((trek) => (
              <li key={trek.id}>
                <TrekCard trek={trek} href={`/o/${organizer.slug}/${trek.slug}`} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function TrekCard({ trek, href }: { trek: PublicOrganizerTrek; href: string }) {
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
          <h3 className="font-medium group-hover:underline">{trek.name}</h3>
          {trek.fromPricePaise !== null && (
            <p className="shrink-0 text-sm">
              <span className="text-muted-foreground">from </span>
              <span className="font-medium">{formatRupees(trek.fromPricePaise)}</span>
            </p>
          )}
        </div>
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
