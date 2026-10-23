import type { Metadata } from "next";

import { RefundPolicy } from "@/features/legal/components/RefundPolicy";

export const metadata: Metadata = {
  title: "Cancellation and refund policy",
  description: "How cancellations and refunds work for treks booked on Chalo Trek.",
};

export default function Page() {
  return <RefundPolicy />;
}
