import type { Metadata } from "next";

import { OrganizerReview } from "@/features/organizers/components/OrganizerReview";

export const metadata: Metadata = { title: "Organizers" };

export default function Page() {
  return <OrganizerReview />;
}
