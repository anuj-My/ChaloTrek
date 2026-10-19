import type { Metadata } from "next";

import { BatchList } from "@/features/batches/components/BatchList";

export const metadata: Metadata = { title: "Batches" };

export default function Page() {
  return <BatchList />;
}
