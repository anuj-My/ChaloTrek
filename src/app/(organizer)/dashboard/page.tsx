import type { Metadata } from "next";

import { DashboardHome } from "@/features/organizers/components/DashboardHome";

export const metadata: Metadata = { title: "Dashboard" };

export default function Page() {
  return <DashboardHome />;
}
