// Booking source tags: organizers share links like /o/himalayan-hikers?src=insta-bio.
// The proxy keeps the tag in a cookie for 30 days (the last tag wins), trek
// page views and bookings are recorded with it, and the organizer's Insights
// page shows views and bookings per tag.

export const SOURCE_COOKIE = "ct_src";
export const SOURCE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

// Links from Chalo Trek's own pages carry this tag, and those bookings count
// as marketplace bookings.
export const MARKETPLACE_TAG = "chalotrek";

// "Insta-Bio" → "insta-bio". Null for anything that isn't a usable tag.
export function cleanSourceTag(raw: string | null | undefined) {
  const tag = raw?.trim().toLowerCase();
  return tag && /^[a-z0-9_-]{1,40}$/.test(tag) ? tag : null;
}

// For links on Chalo Trek's own pages to an organizer's trek.
export function marketplaceHref(path: string) {
  return `${path}?src=${MARKETPLACE_TAG}`;
}
