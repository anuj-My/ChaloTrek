import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionButton } from "@/components/shared/ActionButton";
import { requireUser } from "@/features/auth/queries";
import { formatDateRange, formatRupees, todayInIndia } from "@/lib/format";

import { leaveWaitlist } from "../actions";
import { getBatchForBooking, getMyWaitlistEntry } from "../queries";
import { MAX_PEOPLE_PER_BOOKING } from "../schema";
import { BookingForm } from "./BookingForm";
import { WaitlistForm } from "./WaitlistForm";

type Params = Promise<{ organizer: string; trek: string; batchId: string }>;

// Booking form for one batch. Trekkers log in first, so the booking is theirs.
export async function BookBatch({ params }: { params: Params }) {
  const { organizer: organizerSlug, trek: trekSlug, batchId } = await params;
  const trekPath = `/o/${organizerSlug}/${trekSlug}`;
  const user = await requireUser(`${trekPath}/book/${batchId}`);
  const batch = await getBatchForBooking(organizerSlug, trekSlug, batchId);
  if (!batch) notFound();
  const trek = batch.treks;

  const seatsLeft = batch.seats_left ?? 0;
  const takingBookings = batch.status === "open" && batch.start_date > todayInIndia();
  const bookable = takingBookings && seatsLeft > 0;
  const full = takingBookings && seatsLeft === 0;

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
      <div className="space-y-1">
        <Link href={trekPath} className="text-sm text-muted-foreground hover:text-foreground">
          ← {trek.name}
        </Link>
        <h1 className="font-heading text-2xl font-semibold">Book {trek.name}</h1>
        <p className="text-muted-foreground">
          {formatDateRange(batch.start_date, batch.end_date)} · by {trek.organizers.name} ·{" "}
          {formatRupees(batch.price_paise)} per person
        </p>
      </div>

      {bookable ? (
        <>
          <BookingForm
            batch={{ id: batch.id, price_paise: batch.price_paise, deposit_paise: batch.deposit_paise }}
            maxPeople={Math.min(seatsLeft, MAX_PEOPLE_PER_BOOKING)}
            defaultEmail={user.email}
          />
          {trek.cancellation_policies && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Cancellation policy ({trek.cancellation_policies.name}):</span>{" "}
              {trek.cancellation_policies.description}
            </p>
          )}
        </>
      ) : full ? (
        <Waitlist batchId={batch.id} userId={user.id} trekPath={trekPath} />
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="font-medium">This batch isn&apos;t taking bookings</p>
          <p className="mt-1 text-sm text-muted-foreground">
            It&apos;s closed.{" "}
            <Link href={trekPath} className="underline underline-offset-4">
              See other batches
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}

async function Waitlist({ batchId, userId, trekPath }: { batchId: string; userId: string; trekPath: string }) {
  const entry = await getMyWaitlistEntry(batchId, userId);

  return (
    <div className="space-y-4 rounded-lg border border-dashed p-8 text-center">
      <div>
        <p className="font-medium">This batch is full</p>
        {entry ? (
          <p className="mt-1 text-sm text-muted-foreground">
            You&apos;re on the waitlist for {entry.num_people} {entry.num_people === 1 ? "person" : "people"}. We&apos;ll
            email {entry.email} if seats open up. Seats go to whoever books first.
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">
            Seats open up when someone cancels. Join the waitlist and we&apos;ll email you, or{" "}
            <Link href={trekPath} className="underline underline-offset-4">
              see other batches
            </Link>
            .
          </p>
        )}
      </div>
      <WaitlistForm batchId={batchId} numPeople={entry?.num_people} />
      {entry && (
        <ActionButton action={leaveWaitlist} fields={{ batch_id: batchId }} variant="ghost">
          Leave the waitlist
        </ActionButton>
      )}
    </div>
  );
}
