import type { Metadata } from "next";

import { Privacy } from "@/features/legal/components/Privacy";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What personal data Chalo Trek collects, why, and your rights.",
};

export default function Page() {
  return <Privacy />;
}
