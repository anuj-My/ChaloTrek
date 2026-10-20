import { PagePlaceholder } from "@/components/shared/PagePlaceholder";
import { requireMyOrganizer } from "@/features/organizers/queries";

export async function OrganizerBookings() {
  await requireMyOrganizer();
  return <PagePlaceholder title="Bookings" description="Participants for each batch, with Excel export." />;
}
