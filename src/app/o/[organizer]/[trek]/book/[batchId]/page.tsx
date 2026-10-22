import type { Metadata } from "next";

import { BookBatch } from "@/features/bookings/components/BookBatch";

export const metadata: Metadata = { title: "Book", robots: { index: false } };

export default function Page({ params }: PageProps<"/o/[organizer]/[trek]/book/[batchId]">) {
  return <BookBatch params={params} />;
}
