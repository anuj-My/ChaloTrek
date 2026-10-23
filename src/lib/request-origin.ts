import "server-only";

import { headers } from "next/headers";

import { siteConfig } from "@/lib/site-config";

// The site this request came in on (localhost in dev), for links in emails.
export async function requestOrigin() {
  return (await headers()).get("origin") ?? siteConfig.url;
}
