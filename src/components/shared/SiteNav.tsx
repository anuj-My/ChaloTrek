import Link from "next/link";

import { siteConfig } from "@/lib/site-config";

export function SiteNav() {
  return (
    <header className="border-b">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-heading text-lg font-semibold">
          {siteConfig.name}
        </Link>
        <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
          Log in
        </Link>
      </nav>
    </header>
  );
}
