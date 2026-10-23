import { siteConfig } from "@/lib/site-config";

import { LegalPage } from "./LegalPage";

export function Contact() {
  const { legalName, email, phone, address } = siteConfig.business;

  return (
    <LegalPage title="Contact us" updated="23 Oct 2026">
      <p>
        Questions about a booking, a payment or a refund? Write to us and include your booking ID (it looks like
        CT-10001). We reply within one working day.
      </p>
      <ul>
        {legalName && <li>Business: {legalName}</li>}
        <li>
          Email: <a href={`mailto:${email}`}>{email}</a>
        </li>
        {phone && (
          <li>
            Phone: <a href={`tel:${phone.replaceAll(" ", "")}`}>{phone}</a>
          </li>
        )}
        {address && <li>Address: {address}</li>}
      </ul>
      <p>
        For anything about the trek itself, such as the itinerary, pickup point or what to pack, the organizer is the
        best person to ask. Their contact details are on your booking page.
      </p>
      <h2>Grievances</h2>
      <p>
        If you have a complaint about the platform or how we handle your personal data, email{" "}
        <a href={`mailto:${email}`}>{email}</a> with the subject &quot;Grievance&quot;. We acknowledge complaints within 48
        hours and aim to resolve them within 15 days.
      </p>
    </LegalPage>
  );
}
