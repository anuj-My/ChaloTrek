import { notFound } from "next/navigation";

import { JsonLd } from "@/components/shared/JsonLd";
import { RatingSummary, ReviewList } from "@/components/shared/Reviews";
import { TrekCard } from "@/components/shared/TrekCard";
import { getOrganizerReviews } from "@/features/reviews/queries";
import { getPublicOrganizerTreks } from "@/features/treks/queries";
import { siteConfig } from "@/lib/site-config";

// The organizer's public page, the one link for their Instagram bio: who they
// are and every live trek with its next batch.
export async function OrganizerPage({ params }: { params: Promise<{ organizer: string }> }) {
  const { organizer: slug } = await params;
  const [organizer, reviews] = await Promise.all([getPublicOrganizerTreks(slug), getOrganizerReviews(slug)]);
  if (!organizer) notFound();

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10">
      <JsonLd
        data={{
          "@type": "TravelAgency",
          name: organizer.name,
          url: `${siteConfig.url}/o/${organizer.slug}`,
          ...(organizer.bio && { description: organizer.bio }),
          ...(organizer.instagram_handle && { sameAs: [`https://instagram.com/${organizer.instagram_handle}`] }),
          ...(reviews.average !== null && {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: Number(reviews.average.toFixed(1)),
              reviewCount: reviews.count,
              bestRating: 5,
              worstRating: 1,
            },
          }),
        }}
      />
      <header className="max-w-2xl space-y-3">
        <h1 className="type-1">{organizer.name}</h1>
        <RatingSummary average={reviews.average} count={reviews.count} />
        {organizer.bio && <p className="lead max-w-2xl whitespace-pre-line">{organizer.bio}</p>}
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
        <h2 className="type-3">Treks</h2>
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

      {reviews.count > 0 && (
        <section className="max-w-3xl space-y-4">
          <div className="space-y-1">
            <h2 className="type-3">Reviews</h2>
            <p className="text-sm text-muted-foreground">From trekkers who booked and went with {organizer.name}.</p>
          </div>
          <ReviewList reviews={reviews.reviews} />
        </section>
      )}
    </div>
  );
}
