import { notFound } from "next/navigation";

import { getPublicTrek } from "@/features/treks/queries";

import { BatchOptions } from "./BatchOptions";
import { TrekGallery } from "./TrekGallery";

// The public page an organizer shares: trek details and upcoming batches.
export async function BookingPage({ params }: { params: Promise<{ organizer: string; trek: string }> }) {
  const { organizer: organizerSlug, trek: trekSlug } = await params;
  const trek = await getPublicTrek(organizerSlug, trekSlug);
  if (!trek) notFound();
  const organizer = trek.organizers;

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
      <TrekGallery name={trek.name} photos={trek.photos} />

      {/* Phones: header, batches, details. Desktop: batches in a sticky right column. */}
      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <header className="min-w-0 space-y-3 lg:col-start-1">
          <p className="text-sm text-muted-foreground">by {organizer.name}</p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">{trek.name}</h1>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {facts.map((fact, i) => (
              <li key={i}>{fact}</li>
            ))}
          </ul>
          {trek.summary && <p className="text-lg whitespace-pre-line">{trek.summary}</p>}
        </header>

        <aside className="lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
          <BatchOptions batches={trek.batches} trekPath={`/o/${organizer.slug}/${trek.slug}`} />
        </aside>

        <div className="min-w-0 space-y-10 lg:col-start-1">
          {trek.itinerary.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-heading text-xl font-semibold">Itinerary</h2>
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
              <h2 className="font-heading text-xl font-semibold">Cancellation policy</h2>
              <p>
                <span className="font-medium">{trek.cancellation_policies.name}:</span>{" "}
                {trek.cancellation_policies.description}
              </p>
            </section>
          )}

          <section className="space-y-2">
            <h2 className="font-heading text-xl font-semibold">About {organizer.name}</h2>
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

function ItemList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-3">
      <h2 className="font-heading text-xl font-semibold">{title}</h2>
      <ul className="list-disc space-y-1 pl-5 text-sm">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
