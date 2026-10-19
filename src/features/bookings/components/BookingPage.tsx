import { PagePlaceholder } from "@/components/shared/PagePlaceholder";

export function BookingPage({
  organizerSlug,
  trekSlug,
}: {
  organizerSlug: string;
  trekSlug: string;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <PagePlaceholder
        title={trekSlug}
        description={`Booking page for ${trekSlug} by ${organizerSlug}.`}
      />
    </div>
  );
}
