import type { Metadata } from "next";

import { TrekList } from "@/features/treks/components/TrekList";

export const metadata: Metadata = { title: "Treks" };

export default function Page() {
  return <TrekList />;
}
