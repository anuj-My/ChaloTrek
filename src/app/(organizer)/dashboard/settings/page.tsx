import type { Metadata } from "next";

import { OrganizerSettings } from "@/features/organizers/components/OrganizerSettings";

export const metadata: Metadata = { title: "Settings" };

export default function Page() {
  return <OrganizerSettings />;
}
