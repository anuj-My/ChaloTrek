import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/shared/JsonLd";
import { RatingSummary, ReviewList } from "@/components/shared/Reviews";
import { VerifiedBadge } from "@/components/shared/VerifiedBadge";
import { getTrekReviews } from "@/features/reviews/queries";
import { getPublicTrek, type PublicTrek } from "@/features/treks/queries";
import { siteConfig } from "@/lib/site-config";

import { BatchOptions } from "./BatchOptions";
import { TrekGallery } from "./TrekGallery";
import { TrekViewBeacon } from "./TrekViewBeacon";

// The public page an organizer shares: trek details and upcoming batches.
export async function BookingPage({ params }: { params: Promise<{ organizer: string; trek: string }> }) {
  const { organizer: organizerSlug, trek: trekSlug } = await params;
  const trek = await getPublicTrek(organizerSlug, trekSlug);
  if (!trek) notFound();
  const organizer = trek.organizers;
  const reviews = await getTrekReviews(trek.id);

  const facts = [
    trek.region,
    `${trek.duration_days} ${trek.duration_days === 1 ? "day" : "days"}`,
    <span key="difficulty" className="capitalize">
      {trek.difficulty}
    </span>,
    trek.max_altitude_m && `${trek.max_altitude_m.toLocaleString("en-IN")} m max altitude`,
  ].filter(Boolean);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <JsonLd data={trekJsonLd(trek, reviews)} />
      <TrekViewBeacon trekId={trek.id} />
      <TrekGallery name={trek.name} photos={trek.photos} />

      {/* Phones: header, batches, details. Desktop: batches in a sticky right column. */}
      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <header className="min-w-0 space-y-3 lg:col-start-1">
          <p className="flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
            by{" "}
            <Link href={`/o/${organizer.slug}`} className="underline-offset-4 hover:text-foreground hover:underline">
              {organizer.name}
            </Link>
            {organizer.verified_at && <VerifiedBadge label />}
          </p>
          <h1 className="type-1">{trek.name}</h1>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {facts.map((fact, i) => (
              <li key={i}>{fact}</li>
            ))}
          </ul>
          <RatingSummary average={reviews.average} count={reviews.count} />
          {trek.destinations && (
            <p className="text-sm">
              <Link href={`/treks/${trek.destinations.slug}`} className="underline underline-offset-4">
                Compare all {trek.destinations.name} organizers →
              </Link>
            </p>
          )}
          {trek.summary && <p className="text-lg whitespace-pre-line">{trek.summary}</p>}
        </header>

        <aside className="lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
          <BatchOptions batches={trek.batches} trekPath={`/o/${organizer.slug}/${trek.slug}`} />
        </aside>

        <div className="min-w-0 space-y-10 lg:col-start-1">
          {trek.itinerary.length > 0 && (
            <section className="space-y-4">
              <h2 className="type-3">Itinerary</h2>
              <ol className="space-y-4">
                {trek.itinerary.map((day, i) => (
                  <li key={i} className="grid grid-cols-[4rem_1fr] gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Day {i + 1}</span>
                    <div className="space-y-1">
                      <p className="font-medium">{day.title}</p>
                      {day.description && (
                        <p className="text-sm whitespace-pre-line text-muted-foreground">{day.description}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {(trek.inclusions.length > 0 || trek.exclusions.length > 0) && (
            <section className="grid gap-8 sm:grid-cols-2">
              <ItemList title="What's included" items={trek.inclusions} />
              <ItemList title="Not included" items={trek.exclusions} />
            </section>
          )}

          {trek.cancellation_policies && (
            <section className="space-y-2">
              <h2 className="type-3">Cancellation policy</h2>
              <p>
                <span className="font-medium">{trek.cancellation_policies.name}:</span>{" "}
                {trek.cancellation_policies.description}
              </p>
            </section>
          )}

          {reviews.count > 0 && (
            <section className="space-y-4">
              <div className="space-y-1">
                <h2 className="type-3">Reviews</h2>
                <p className="text-sm text-muted-foreground">Only trekkers who booked and went on this trek can review it.</p>
              </div>
              <ReviewList reviews={reviews.reviews} />
            </section>
          )}

          <section className="space-y-2">
            <h2 className="type-3">About {organizer.name}</h2>
            {organizer.bio && <p className="whitespace-pre-line text-muted-foreground">{organizer.bio}</p>}
            {organizer.instagram_handle && (
              <a
                href={`https://instagram.com/${organizer.instagram_handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline underline-offset-4"
              >
                @{organizer.instagram_handle} on Instagram
              </a>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

// The trek as a schema.org Product, so search results can show its price
// range and rating.
function trekJsonLd(trek: PublicTrek, reviews: Awaited<ReturnType<typeof getTrekReviews>>) {
  const url = `${siteConfig.url}/o/${trek.organizers.slug}/${trek.slug}`;
  const open = trek.batches.filter((b) => b.status === "open" && (b.seats_left ?? 0) > 0);
  const prices = trek.batches.map((b) => b.price_paise / 100);
  return {
    "@type": "Product",
    name: trek.name,
    url,
    image: trek.photos,
    description: trek.summary ?? `${trek.duration_days}-day trek in ${trek.region} by ${trek.organizers.name}.`,
    brand: { "@type": "Organization", name: trek.organizers.name, url: `${siteConfig.url}/o/${trek.organizers.slug}` },
    ...(prices.length > 0 && {
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "INR",
        lowPrice: Math.min(...prices),
        highPrice: Math.max(...prices),
        offerCount: trek.batches.length,
        availability: open.length > 0 ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
        url,
      },
    }),
    ...(reviews.average !== null && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: Number(reviews.average.toFixed(1)),
        reviewCount: reviews.count,
        bestRating: 5,
        worstRating: 1,
      },
      review: reviews.reviews.slice(0, 5).map((r) => ({
        "@type": "Review",
        author: { "@type": "Person", name: r.author_name },
        datePublished: r.created_at.slice(0, 10),
        reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
        ...(r.body && { reviewBody: r.body }),
      })),
    }),
  };
}

function ItemList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-3">
      <h2 className="type-3">{title}</h2>
      <ul className="list-disc space-y-1 pl-5 text-sm">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
