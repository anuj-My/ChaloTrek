import type { Metadata } from "next";

import { BookingDetails } from "@/features/bookings/components/BookingDetails";

export const metadata: Metadata = { title: "Booking" };

export default function Page({ params }: PageProps<"/my-bookings/[bookingId]">) {
  return <BookingDetails params={params} />;
}
