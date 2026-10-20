import type { Metadata } from "next";

import { MyBookings } from "@/features/bookings/components/MyBookings";

export const metadata: Metadata = { title: "My bookings" };

export default function Page() {
  return <MyBookings />;
}
