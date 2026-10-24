import { requireMyOrganizer } from "../queries";
import { KycForm } from "./KycForm";
import { KycBadge } from "./KycStatus";
import { OrganizerProfileForm } from "./OrganizerProfileForm";

export async function OrganizerSettings() {
  const organizer = await requireMyOrganizer();
  const kyc = organizer.organizer_kyc;

  return (
    <div className="max-w-xl space-y-10">
      <h1 className="type-2">Settings</h1>

      <section className="space-y-4">
        <h2 className="type-4">Company profile</h2>
        <OrganizerProfileForm organizer={organizer} />
      </section>

      <section id="kyc" className="scroll-mt-8 space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="type-4">KYC</h2>
            <KycBadge organizer={organizer} />
          </div>
          <p className="text-sm text-muted-foreground">
            Only you and the Chalo Trek team can see these details.
          </p>
        </div>
        {organizer.kyc_status === "rejected" && kyc?.review_notes && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <span className="font-medium">What to fix: </span>
            {kyc.review_notes}
          </p>
        )}
        <KycForm kyc={kyc} locked={organizer.kyc_status === "approved"} />
      </section>
    </div>
  );
}
