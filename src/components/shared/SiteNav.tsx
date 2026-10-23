import Link from "next/link";

import { siteConfig } from "@/lib/site-config";

// `actions` is the right-hand side of the nav, e.g. login or account links.
export function SiteNav({ actions }: { actions?: React.ReactNode }) {
  return (
    <header className="border-b">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-heading text-lg font-semibold">
          {siteConfig.name}
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/treks" className="text-sm text-muted-foreground hover:text-foreground">
            Explore treks
          </Link>
          {actions}
        </div>
      </nav>
    </header>
  );
}
