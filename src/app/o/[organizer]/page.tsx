import type { Metadata } from "next";

import { OrganizerPage } from "@/features/organizers/components/OrganizerPage";
import { getPublicOrganizerTreks } from "@/features/treks/queries";

export async function generateMetadata({ params }: PageProps<"/o/[organizer]">): Promise<Metadata> {
  const { organizer: slug } = await params;
  const organizer = await getPublicOrganizerTreks(slug);
  if (!organizer) return { title: "Organizer not found" };
  const title = `${organizer.name}: treks and batches`;
  const description = organizer.bio ?? `Upcoming treks by ${organizer.name}. See dates, prices and book online.`;
  const cover = organizer.treks.find((t) => t.coverUrl)?.coverUrl;
  return { title, description, openGraph: { title, description, images: cover ? [cover] : [] } };
}

export default function Page({ params }: PageProps<"/o/[organizer]">) {
  return <OrganizerPage params={params} />;
}
