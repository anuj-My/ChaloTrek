// UPI payment helpers shared by server and client code. Until Razorpay is
// live, trekkers pay the organizer's UPI ID and send a payment proof
// (payment_proofs), which the organizer accepts or rejects.

export const PAYMENT_PROOFS_BUCKET = "payment-proofs";

// A "pay" link any UPI app opens, with the amount and booking ID filled in.
// The same text, as a QR code, can be scanned from another phone.
export function upiPayUrl({
  upiId,
  payeeName,
  amountPaise,
  note,
}: {
  upiId: string;
  payeeName: string;
  amountPaise: number;
  note: string;
}) {
  const params = new URLSearchParams({
    pa: upiId,
    pn: payeeName,
    am: (amountPaise / 100).toFixed(2),
    cu: "INR",
    tn: note,
  });
  // UPI apps expect %20 for spaces, not "+", and some misread an encoded "@".
  return `upi://pay?${params.toString().replace(/\+/g, "%20").replace(/%40/g, "@")}`;
}

// The only screenshot paths a trekker may attach to a booking's proof: files
// directly inside that booking's folder, named the way the uploader names them.
export function isPaymentProofPath(path: string, bookingId: string) {
  const prefix = `${bookingId}/`;
  return path.startsWith(prefix) && /^[0-9a-f-]{36}\.(webp|jpg)$/.test(path.slice(prefix.length));
}
