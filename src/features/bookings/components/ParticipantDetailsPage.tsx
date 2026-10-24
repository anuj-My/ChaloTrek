import { notFound } from "next/navigation";

import { formatDateRange } from "@/lib/format";

import { getParticipantByToken } from "../queries";
import { bookingReference } from "../status";
import { ParticipantDetailsForm } from "./ParticipantDetailsForm";

// Where a co-traveller fills in their own details, from the link the person
// who booked sent them.
export async function ParticipantDetailsPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const participant = await getParticipantByToken(token);
  if (!participant) notFound();
  const firstName = participant.full_name.split(" ")[0];

  return (
    <div className="mx-auto max-w-xl space-y-8 px-4 py-12">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Booking {bookingReference(participant.booking_number)} · {participant.organizer_name}
        </p>
        <h1 className="type-2">
          {participant.can_edit ? `Hi ${firstName}, you're going on ${participant.trek_name}` : participant.trek_name}
        </h1>
        <p className="text-muted-foreground">{formatDateRange(participant.start_date, participant.end_date)}</p>
      </div>

      {participant.can_edit ? (
        <>
          <p className="text-sm text-muted-foreground">
            {participant.organizer_name} needs a few details for your safety on the trek. Only they and Chalo Trek can
            see them. You can come back to this link to change them until the trek starts.
          </p>
          <ParticipantDetailsForm token={token} participant={participant} />
        </>
      ) : (
        <p className="rounded-lg border p-4 text-sm text-muted-foreground">
          This booking can no longer be changed, because the trek has started or the booking isn&apos;t active. Contact
          the person who booked if something needs fixing.
        </p>
      )}
    </div>
  );
}
