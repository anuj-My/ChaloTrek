import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section className="relative isolate flex min-h-[560px] items-end overflow-hidden bg-foreground md:min-h-[680px]">
      <Image
        src="/images/hero/hero-lake.jpg"
        alt="A trekker standing by a still Himalayan lake below snow peaks"
        fill
        preload
        sizes="100vw"
        className="-z-10 object-cover object-[30%_center]"
      />
      {/* Darken the photo so the text reads, fading into night at the bottom. */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-foreground/30 via-foreground/45 to-foreground/95" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-foreground/60 via-transparent to-transparent" />

      <div className="mx-auto w-full max-w-6xl px-4 pt-32 pb-16 md:pb-24">
        <p className="text-xs font-medium tracking-[0.25em] text-secondary uppercase">
          Verified organizers · Live seats
        </p>
        <h1 className="mt-4 max-w-3xl type-display text-white">
          Walk quietly into <em className="text-cta-glow">the high mountains.</em>
        </h1>
        <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/80">
          Pick a trek, choose a batch that fits your calendar, and book online with real dates,
          prices and seats left.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="#treks" className={cn(buttonVariants({ variant: "cta", size: "lg" }))}>
            See upcoming treks
          </Link>
          <Link
            href="/treks"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "border-white/30 bg-white/10 text-white backdrop-blur hover:bg-white/20 hover:text-white",
            )}
          >
            Explore all treks
          </Link>
        </div>
      </div>
    </section>
  );
}
