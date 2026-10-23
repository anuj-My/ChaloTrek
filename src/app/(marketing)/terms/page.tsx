import type { Metadata } from "next";

import { Terms } from "@/features/legal/components/Terms";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "The terms for booking and listing treks on Chalo Trek.",
};

export default function Page() {
  return <Terms />;
}
