import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site-config";

// Private and per-person pages stay out of search results.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/admin", "/my-bookings", "/login", "/auth", "/api", "/o/*/*/book/", "/details/"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
