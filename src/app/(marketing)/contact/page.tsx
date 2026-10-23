import type { Metadata } from "next";

import { Contact } from "@/features/legal/components/Contact";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Get help with a Chalo Trek booking, payment or refund.",
};

export default function Page() {
  return <Contact />;
}
