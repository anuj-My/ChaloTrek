import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-20 pb-16">
      <h1 className="font-heading text-4xl font-semibold tracking-tight md:text-5xl">
        {siteConfig.name}
      </h1>
      <p className="mt-4 max-w-xl text-lg text-muted-foreground">
        {siteConfig.description}. See real dates, prices and seats left, and book online.
      </p>
      <Link href="#treks" className={cn(buttonVariants({ size: "lg" }), "mt-8")}>
        See upcoming treks
      </Link>
    </section>
  );
}
