import { siteConfig } from "@/lib/site-config";

export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24">
      <h1 className="font-heading text-4xl font-semibold tracking-tight md:text-5xl">
        {siteConfig.name}
      </h1>
      <p className="mt-4 max-w-xl text-lg text-muted-foreground">
        {siteConfig.description}
      </p>
    </section>
  );
}
