import { siteConfig } from "@/lib/site-config";

// Cached at build time, so the year updates on the next deploy.
export async function SiteFooter() {
  "use cache";

  return (
    <footer className="border-t">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted-foreground">
        © {new Date().getFullYear()} {siteConfig.name}
      </div>
    </footer>
  );
}
