import Link from "next/link";

import { getUser } from "@/features/auth/queries";

import { getMyOrganizer } from "../queries";
import { KycStatusBanner } from "./KycStatus";
import { OrganizerProfileForm } from "./OrganizerProfileForm";

export async function DashboardHome() {
  const organizer = await getMyOrganizer();

  if (!organizer) {
    const user = await getUser();
    return (
      <div className="max-w-xl space-y-6">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold">Set up your organizer profile</h1>
          <p className="text-muted-foreground">
            This is what trekkers see on your booking pages. It takes a minute.
          </p>
        </div>
        <OrganizerProfileForm defaultEmail={user?.email} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">{organizer.name}</h1>
        <p className="text-sm text-muted-foreground">
          Your page, for your Instagram bio:{" "}
          <Link
            href={`/o/${organizer.slug}`}
            target="_blank"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            chalotrek.in/o/{organizer.slug}
          </Link>
          {organizer.kyc_status !== "approved" && " (goes live once your KYC is approved)"}
        </p>
      </div>
      <KycStatusBanner organizer={organizer} />
    </div>
  );
}
