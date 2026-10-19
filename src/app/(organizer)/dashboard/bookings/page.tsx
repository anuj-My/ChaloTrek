import type { Metadata } from "next";

import { OrganizerBookings } from "@/features/bookings/components/OrganizerBookings";

export const metadata: Metadata = { title: "Bookings" };

export default function Page() {
  return <OrganizerBookings />;
}
