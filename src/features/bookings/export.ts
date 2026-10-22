import "server-only";

import { getMyBatchBookings } from "./queries";
import { BOOKING_STATUS_LABELS, bookingReference } from "./status";

// A cell Excel would run as a formula (=, +, -, @) gets a leading apostrophe,
// so a participant can't plant one. Plain numbers like "+91 98765 43210" stay.
function cell(value: string | number | null) {
  let text = value === null ? "" : String(value);
  if (/^[=@\t\r]/.test(text) || /^[+-](?![\d\s()-]*$)/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

const HEADER = [
  "Booking ID",
  "Status",
  "Name",
  "Age",
  "Gender",
  "Phone",
  "Emergency contact",
  "Emergency phone",
  "Medical notes",
  "Booking phone",
  "Booking email",
];

// Participant list for one batch as CSV, one row per person on a confirmed or
// held booking. Starts with a BOM so Excel reads it as UTF-8.
export async function participantsCsv(batchId: string) {
  const batch = await getMyBatchBookings(batchId);
  const rows = batch.activeBookings.flatMap((booking) =>
    booking.participants.map((p) => [
      bookingReference(booking.booking_number),
      BOOKING_STATUS_LABELS[booking.displayStatus],
      p.full_name,
      p.age,
      p.gender,
      p.phone,
      p.emergency_contact_name,
      p.emergency_contact_phone,
      p.medical_notes,
      booking.contact_phone,
      booking.contact_email,
    ]),
  );
  const csv = [HEADER, ...rows].map((row) => row.map(cell).join(",")).join("\r\n");
  return {
    filename: `${batch.treks.slug}-${batch.start_date}-participants.csv`,
    csv: `﻿${csv}\r\n`,
  };
}
