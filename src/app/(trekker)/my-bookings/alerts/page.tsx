import type { Metadata } from "next";

import { MyAlerts } from "@/features/alerts/components/MyAlerts";

export const metadata: Metadata = { title: "Batch alerts" };

export default function Page() {
  return <MyAlerts />;
}
