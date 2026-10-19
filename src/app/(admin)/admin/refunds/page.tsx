import type { Metadata } from "next";

import { RefundList } from "@/features/payments/components/RefundList";

export const metadata: Metadata = { title: "Refunds" };

export default function Page() {
  return <RefundList />;
}
