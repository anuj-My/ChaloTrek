import type { Metadata } from "next";

import { AdminOverview } from "@/features/bookings/components/AdminOverview";

export const metadata: Metadata = { title: "Admin" };

export default function Page() {
  return <AdminOverview />;
}
