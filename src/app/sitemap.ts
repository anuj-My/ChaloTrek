import type { MetadataRoute } from "next";

import { listSitemapEntries } from "@/features/treks/queries";
import { siteConfig } from "@/lib/site-config";

// Public pages for search engines. Reads the database on each request (the
// Supabase client reads cookies), so new treks show up straight away.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = (path: string) => `${siteConfig.url}${path}`;
  const organizers = await listSitemapEntries();
  const destinations = new Set(organizers.flatMap((o) => o.treks.flatMap((t) => t.destinations?.slug ?? [])));

  return [
    { url: url("/"), changeFrequency: "daily", priority: 1 },
    { url: url("/treks"), changeFrequency: "daily", priority: 0.9 },
    ...[...destinations].map((slug) => ({ url: url(`/treks/${slug}`), changeFrequency: "daily" as const, priority: 0.9 })),
    ...organizers.flatMap((organizer) => [
      { url: url(`/o/${organizer.slug}`), lastModified: organizer.updated_at, priority: 0.7 },
      ...organizer.treks.map((trek) => ({
        url: url(`/o/${organizer.slug}/${trek.slug}`),
        lastModified: trek.updated_at,
        changeFrequency: "daily" as const,
        priority: 0.8,
      })),
    ]),
    ...["/contact", "/terms", "/privacy", "/refund-policy"].map((path) => ({ url: url(path), priority: 0.3 })),
  ];
}
