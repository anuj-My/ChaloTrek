import { awaitingReview, listOrganizersForReview } from "../queries";
import { KycBadge } from "./KycStatus";
import { ReviewForm } from "./ReviewForm";

const dateFormat = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" });

export async function OrganizerReview() {
  const organizers = await listOrganizersForReview();
  // Waiting for review first, then everyone else, newest first within each.
  const sorted = [...organizers].sort(
    (a, b) => Number(awaitingReview(b.organizer_kyc)) - Number(awaitingReview(a.organizer_kyc)),
  );

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">Organizers</h1>
        <p className="text-muted-foreground">
          {organizers.filter((o) => awaitingReview(o.organizer_kyc)).length} waiting for review
        </p>
      </div>

      {sorted.length === 0 && <p className="text-muted-foreground">No organizers yet.</p>}

      <ul className="space-y-4">
        {sorted.map((organizer) => {
          const kyc = organizer.organizer_kyc;
          return (
            <li key={organizer.id} className="space-y-4 rounded-lg border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-medium">{organizer.name}</h2>
                <KycBadge organizer={organizer} />
                <span className="text-sm text-muted-foreground">/o/{organizer.slug}</span>
              </div>

              <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                <Detail label="Phone" value={organizer.phone} />
                <Detail label="Email" value={organizer.email} />
                <Detail label="Instagram" value={organizer.instagram_handle && `@${organizer.instagram_handle}`} />
                <Detail label="Joined" value={dateFormat.format(new Date(organizer.created_at))} />
                <Detail label="Legal name" value={kyc?.legal_name} />
                <Detail label="PAN" value={kyc?.pan} />
                <Detail label="GSTIN" value={kyc?.gstin} />
                <Detail label="Tourism reg. no." value={kyc?.tourism_reg_no} />
                <Detail
                  label="KYC submitted"
                  value={kyc?.submitted_at && dateFormat.format(new Date(kyc.submitted_at))}
                />
                <Detail label="Last review note" value={kyc?.review_notes} />
              </dl>

              <ReviewForm organizerId={organizer.id} canApprove={!!kyc?.submitted_at} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex gap-2">
      <dt className="w-32 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="break-all">{value || "—"}</dd>
    </div>
  );
}
