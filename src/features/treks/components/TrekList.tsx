import { PagePlaceholder } from "@/components/shared/PagePlaceholder";
import { requireMyOrganizer } from "@/features/organizers/queries";

export async function TrekList() {
  await requireMyOrganizer();
  return <PagePlaceholder title="Treks" description="Create and edit your treks." />;
}
