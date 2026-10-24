import Link from "next/link";

import { ActionButton } from "@/components/shared/ActionButton";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatDateRange, formatDateTime, formatRupees, todayInIndia } from "@/lib/format";

import { cancelBooking } from "../actions";
import { getMyBooking, type MyBooking } from "../queries";
import { amountDueNowPaise, type BookingDisplayStatus, bookingReference } from "../status";
import { BookingStatusBadge } from "./BookingStatusBadge";
import { HoldTimer } from "./HoldTimer";
import { ReviewForm } from "./ReviewForm";
import { ShareDetailsLink } from "./ShareDetailsLink";
import { UpiPayment } from "./UpiPayment";

// A trekker's booking: what they booked, who's going, and paying for it.
export async function BookingDetails({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  const booking = await getMyBooking(bookingId);
  const status = booking.displayStatus;
  const batch = booking.batches;
  const trek = batch.treks;
  // Co-travellers can fill in their details until the trek starts.
  const detailsOpen = (status === "held" || status === "confirmed") && batch.start_date > todayInIndia();
  const missing = booking.participants.filter((p) => p.age === null).length;

  return (
    <div className="max-w-2xl space-y-8">
      <div className="space-y-1">
        <Link href="/my-bookings" className="text-sm text-muted-foreground hover:text-foreground">
          ← My bookings
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="type-2">{trek.name}</h1>
          <BookingStatusBadge status={status} />
        </div>
        <p className="text-muted-foreground">
          {formatDateRange(batch.start_date, batch.end_date)} · by {trek.organizers.name}
        </p>
        <p className="text-sm text-muted-foreground">Booking ID {bookingReference(booking.booking_number)}</p>
      </div>

      <PaymentPanel booking={booking} status={status} />

      {status === "confirmed" && batch.end_date < todayInIndia() && (
        <section className="space-y-4 rounded-xl border p-5">
          <div className="space-y-1">
            <h2 className="type-4">
              {booking.reviews ? "Your review" : "How was the trek?"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {booking.reviews?.hidden
                ? "Your review was hidden by Chalo Trek for breaking our guidelines. Edit it and contact us if you think this is a mistake."
                : `Your review is shown on ${trek.name} and ${trek.organizers.name}'s page, marked as verified, and helps other trekkers choose.`}
            </p>
          </div>
          <ReviewForm
            bookingId={booking.id}
            organizerName={trek.organizers.name}
            defaultName={booking.participants[0]?.full_name.split(" ")[0] ?? ""}
            review={booking.reviews}
          />
        </section>
      )}

      <section className="space-y-3">
        <h2 className="type-4">
          {booking.num_people} {booking.num_people === 1 ? "person" : "people"}
        </h2>
        {missing > 0 && detailsOpen && (
          <p className="text-sm text-muted-foreground">
            {missing === 1 ? "1 person still needs" : `${missing} people still need`} to fill in their details. Send
            each one their link; the organizer needs these before the trek.
          </p>
        )}
        <ul className="divide-y rounded-lg border">
          {booking.participants.map((p) => (
            <li key={p.id} className="flex flex-col gap-2 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="font-medium">{p.full_name}</span>
              {p.age !== null ? (
                <span className="text-muted-foreground capitalize">
                  {p.age} · {p.gender}
                  {p.details_token && " · filled in by them"}
                </span>
              ) : detailsOpen && p.details_token ? (
                <ShareDetailsLink
                  token={p.details_token}
                  firstName={p.full_name.split(" ")[0]}
                  trekName={trek.name}
                />
              ) : (
                <span className="text-muted-foreground">Details not filled in</span>
              )}
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground">
          Contact: {booking.contact_email} · {booking.contact_phone}
        </p>
      </section>
    </div>
  );
}

function PaymentPanel({ booking, status }: { booking: MyBooking; status: BookingDisplayStatus }) {
  const batch = booking.batches;
  const organizer = batch.treks.organizers;
  const dueNow = amountDueNowPaise(batch, booking.num_people, booking.discount_paise);
  const balance = booking.total_paise - booking.paid_paise;
  const bookAgain = `/o/${organizer.slug}/${batch.treks.slug}/book/${booking.batch_id}`;
  const reference = bookingReference(booking.booking_number);
  // Newest first. While one waits for the organizer, no other can be sent.
  const proofSent = booking.payment_proofs.find((p) => p.status === "submitted");
  const lastProof = booking.payment_proofs[0];
  const rejectedReason = lastProof?.status === "rejected" ? lastProof.reject_reason : null;
  const upi = (amountPaise: number) =>
    organizer.upi_id && (
      <UpiPayment
        bookingId={booking.id}
        reference={reference}
        upiId={organizer.upi_id}
        payeeName={organizer.name}
        amountPaise={amountPaise}
        maxPaise={balance}
        rejectedReason={rejectedReason}
      />
    );
  const sentNote = proofSent && (
    <p className="rounded-lg bg-muted p-3 text-sm">
      You sent {formatRupees(proofSent.amount_paise)} by UPI (transaction ID {proofSent.utr}) on{" "}
      {formatDateTime(proofSent.created_at)}. {organizer.name} is checking it
      {booking.status === "pending" && ", and your seats are held meanwhile"}. We&apos;ll email you once it&apos;s
      confirmed.
    </p>
  );

  return (
    <section className="space-y-3 rounded-xl border p-5">
      {booking.discount_paise > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Coupon discount</span>
          <span>−{formatRupees(booking.discount_paise)}</span>
        </div>
      )}
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Total</span>
        <span>{formatRupees(booking.total_paise)}</span>
      </div>

      {status === "held" && (
        <>
          <div className="flex justify-between border-t pt-3 font-medium">
            <span>{dueNow < booking.total_paise ? "Deposit to pay now" : "To pay now"}</span>
            <span>{formatRupees(dueNow)}</span>
          </div>
          {!proofSent && booking.hold_expires_at && <HoldTimer expiresAt={booking.hold_expires_at} />}
          {proofSent ? (
            sentNote
          ) : organizer.upi_id ? (
            upi(dueNow)
          ) : (
            <>
              <Button size="lg" className="w-full" disabled>
                Pay {formatRupees(dueNow)}
              </Button>
              <p className="text-sm text-muted-foreground">
                Online payment is being set up and isn&apos;t live yet.
                {organizer.instagram_handle && (
                  <>
                    {" "}
                    To complete your booking now, message{" "}
                    <a
                      href={`https://ig.me/m/${organizer.instagram_handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-foreground underline underline-offset-4"
                    >
                      @{organizer.instagram_handle}
                    </a>{" "}
                    with your booking ID.
                  </>
                )}
              </p>
            </>
          )}
          <ActionButton
            action={cancelBooking}
            fields={{ booking_id: booking.id }}
            variant="ghost"
            confirm="Cancel this booking? Your seats will be released."
          >
            Cancel booking
          </ActionButton>
        </>
      )}

      {status === "expired" && proofSent && <div className="border-t pt-3">{sentNote}</div>}

      {status === "expired" && !proofSent && (
        <div className="space-y-3 border-t pt-3">
          <p className="text-sm text-muted-foreground">
            Your seat hold ran out before payment, so this booking wasn&apos;t completed. If you&apos;ve paid the
            organizer directly, they can still confirm it while seats are free.
          </p>
          <Link href={bookAgain} className={buttonVariants({ variant: "outline" })}>
            Book again
          </Link>
        </div>
      )}

      {status === "confirmed" && (
        <>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Paid</span>
            <span>{formatRupees(booking.paid_paise)}</span>
          </div>
          {balance > 0 && (
            <div className="flex justify-between border-t pt-3 font-medium">
              <span>Balance, paid to the organizer</span>
              <span>{formatRupees(balance)}</span>
            </div>
          )}
          {balance > 0 && proofSent && sentNote}
          {balance > 0 && !proofSent && organizer.upi_id && (
            <details open={!!rejectedReason}>
              <summary className="cursor-pointer text-sm font-medium underline underline-offset-4">
                Pay the balance by UPI
              </summary>
              {upi(balance)}
            </details>
          )}
          {/* RLS shows the link only once the booking is confirmed. */}
          {batch.batch_group_links && (
            <div className="space-y-2 border-t pt-3">
              <a
                href={batch.batch_group_links.url}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ size: "lg", className: "w-full" })}
              >
                Join the WhatsApp group
              </a>
              <p className="text-sm text-muted-foreground">
                Get updates from {organizer.name} and meet your group before the trek.
              </p>
            </div>
          )}
        </>
      )}

      {status === "cancelled" && (
        <p className="border-t pt-3 text-sm text-muted-foreground">
          {booking.cancelled_by === "trekker" ? "You cancelled this booking." : "The organizer cancelled this booking."}
          {booking.paid_paise > 0 &&
            ` Contact ${organizer.name} about refunding the ${formatRupees(booking.paid_paise)} you paid.`}
        </p>
      )}

      {status === "refunded" && (
        <p className="border-t pt-3 text-sm text-muted-foreground">This booking was refunded.</p>
      )}
    </section>
  );
}
