import { BookingPage } from "@/features/bookings/components/BookingPage";

export default async function Page({ params }: PageProps<"/o/[organizer]/[trek]">) {
  const { organizer, trek } = await params;
  return <BookingPage organizerSlug={organizer} trekSlug={trek} />;
}
