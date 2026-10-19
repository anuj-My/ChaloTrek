import type { Metadata } from "next";

import { MyBookings } from "@/features/bookings/components/MyBookings";

export const metadata: Metadata = { title: "My bookings" };

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <MyBookings />
    </div>
  );
}
