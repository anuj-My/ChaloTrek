import Link from "next/link";

import { Badge } from "@/components/ui/badge";

import { awaitingReview, type MyOrganizer } from "../queries";

export function KycBadge({ organizer }: { organizer: Pick<MyOrganizer, "kyc_status" | "organizer_kyc"> }) {
  if (organizer.kyc_status === "approved") return <Badge>Approved</Badge>;
  if (organizer.kyc_status === "rejected" && !awaitingReview(organizer.organizer_kyc)) {
    return <Badge variant="destructive">Changes needed</Badge>;
  }
  if (awaitingReview(organizer.organizer_kyc)) return <Badge variant="secondary">In review</Badge>;
  return <Badge variant="outline">KYC not submitted</Badge>;
}

// Tells the organizer what to do next to get approved.
export function KycStatusBanner({ organizer }: { organizer: MyOrganizer }) {
  const kyc = organizer.organizer_kyc;
  const inReview = awaitingReview(kyc);

  let title: string;
  let body: React.ReactNode;
  if (organizer.kyc_status === "approved") {
    title = "You're approved";
    body = "Your treks can now take bookings once you publish them.";
  } else if (organizer.kyc_status === "rejected" && !inReview) {
    title = "Some details need fixing";
    body = kyc?.review_notes ?? "Please check your KYC details and resubmit.";
  } else if (inReview) {
    title = "We're reviewing your details";
    body = "This usually takes 1–2 working days. You can set up treks meanwhile.";
  } else {
    title = "Submit your KYC to start taking bookings";
    body = "We need your PAN and tourism registration to verify your company.";
  }

  const showSettingsLink = organizer.kyc_status !== "approved" && !inReview;

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <p className="font-medium">{title}</p>
          <KycBadge organizer={organizer} />
        </div>
        <p className="text-sm text-muted-foreground">{body}</p>
      </div>
      {showSettingsLink && (
        <Link
          href="/dashboard/settings#kyc"
          className="text-sm font-medium whitespace-nowrap underline underline-offset-4"
        >
          {kyc?.submitted_at ? "Update KYC" : "Submit KYC"}
        </Link>
      )}
    </div>
  );
}
