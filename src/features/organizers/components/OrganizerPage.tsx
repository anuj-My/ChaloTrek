import { notFound } from "next/navigation";

import { TrekCard } from "@/components/shared/TrekCard";
import { getPublicOrganizerTreks } from "@/features/treks/queries";

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
