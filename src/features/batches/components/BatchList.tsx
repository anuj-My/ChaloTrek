import { PagePlaceholder } from "@/components/shared/PagePlaceholder";
import { requireMyOrganizer } from "@/features/organizers/queries";

export async function BatchList() {
  await requireMyOrganizer();
  return <PagePlaceholder title="Batches" description="Dates, price and seats for each departure." />;
}
