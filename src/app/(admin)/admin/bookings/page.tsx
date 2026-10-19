import type { Metadata } from "next";

import { AdminBookings } from "@/features/bookings/components/AdminBookings";

export const metadata: Metadata = { title: "All bookings" };

export default function Page() {
  return <AdminBookings />;
}
