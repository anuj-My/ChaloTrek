import QRCode from "qrcode";

import { buttonVariants } from "@/components/ui/button";
import { formatRupees } from "@/lib/format";

import { upiPayUrl } from "../upi";
import { PaymentProofForm } from "./PaymentProofForm";

type Props = {
  bookingId: string;
  reference: string;
  upiId: string;
  payeeName: string;
  amountPaise: number;
  // What's still due, the most a proof can be for.
  maxPaise: number;
  // The organizer's note on the last proof, when they rejected it.
  rejectedReason?: string | null;
};

// Pay the organizer by UPI: a QR code to scan from another phone, a button
// that opens a UPI app on this one, then the form to send the transaction ID.
export async function UpiPayment({ bookingId, reference, upiId, payeeName, amountPaise, maxPaise, rejectedReason }: Props) {
  const url = upiPayUrl({ upiId, payeeName, amountPaise, note: reference });
  // Generated here from our own data, so it's safe to inline.
  const qr = await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M" });

  return (
    <div className="space-y-5 border-t pt-4">
      {rejectedReason && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <span className="font-medium">{payeeName} couldn&apos;t match your last payment: </span>
          {rejectedReason}
        </p>
      )}

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div
          role="img"
          aria-label={`UPI QR code to pay ${formatRupees(amountPaise)} to ${upiId}`}
          // QR codes need dark on light to scan, whatever the theme.
          className="size-40 shrink-0 rounded-lg bg-white p-2 [&_svg]:size-full"
          dangerouslySetInnerHTML={{ __html: qr }}
        />
        <div className="space-y-2 text-sm">
          <p className="font-medium">
            Pay {formatRupees(amountPaise)} to {payeeName} by UPI
          </p>
          <p className="text-muted-foreground">
            Scan with any UPI app (Google Pay, PhonePe, Paytm, BHIM), or pay the UPI ID{" "}
            <span className="font-mono font-medium text-foreground select-all">{upiId}</span>. Add {reference} as the
            note.
          </p>
          <a href={url} className={buttonVariants({ size: "lg", className: "w-full sm:hidden" })}>
            Open UPI app
          </a>
        </div>
      </div>

      <div className="space-y-3 border-t pt-4">
        <div className="space-y-1">
          <h3 className="font-medium">Paid? Send the transaction ID</h3>
          <p className="text-sm text-muted-foreground">
            {payeeName} checks it against their bank and confirms your booking. Your seats stay held for 24 hours while
            they check.
          </p>
        </div>
        <PaymentProofForm bookingId={bookingId} amountPaise={amountPaise} maxPaise={maxPaise} />
      </div>
    </div>
  );
}
