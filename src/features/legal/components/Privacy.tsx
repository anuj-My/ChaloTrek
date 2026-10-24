import Link from "next/link";

import { siteConfig } from "@/lib/site-config";

import { LegalPage } from "./LegalPage";

// Written for India's DPDP Act. Have a lawyer review it before launch, and
// update the "who we share it with" list when adding a service (Razorpay,
// WhatsApp, analytics).
export function Privacy() {
  const { name } = siteConfig;
  const { legalName, email } = siteConfig.business;
  const operator = legalName || name;

  return (
    <LegalPage title="Privacy policy" updated="24 Oct 2026">
      <p>
        This policy explains what personal data {operator} collects through {name}, why, and the choices you have. We
        collect only what is needed to book and run treks.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Your account:</strong> your email address, and your name if you log in with Google.
        </li>
        <li>
          <strong>Booking details:</strong> a contact email and phone number, and for each person on the booking their
          name, age, gender, optional phone number, an emergency contact, and any medical notes you choose to share.
          If someone books for you, they may give only your name, and you add the rest through a private link they send
          you; anyone with that link can see and change those details until the trek starts.
        </li>
        <li>
          <strong>Organizers:</strong> business name and contact details, PAN, GSTIN, bank account and tourism
          registration, to verify the business and pay it.
        </li>
        <li>
          <strong>Payments:</strong> payment amounts and status from our payment partner, and, when you pay an
          organizer by UPI, the transaction ID and any screenshot you send so they can check it. We never receive your
          card, UPI PIN or bank login details.
        </li>
        <li>
          <strong>Technical data:</strong> login cookies that keep you signed in, and basic server logs.
        </li>
      </ul>

      <h2>Why we use it</h2>
      <ul>
        <li>To create and manage your bookings, and send confirmations and updates about them.</li>
        <li>
          To share booking and participant details with the organizer of the trek you booked, who needs them to run it
          safely, including your medical notes and emergency contact.
        </li>
        <li>To verify organizers, process payments and refunds, and meet tax and legal obligations.</li>
        <li>To prevent fraud and keep the platform secure.</li>
      </ul>
      <p>We don&apos;t sell your data, and we don&apos;t use it for advertising.</p>

      <h2>Who we share it with</h2>
      <ul>
        <li>The organizer of the trek you book.</li>
        <li>
          Service providers who help us run {name}, under contract: Supabase (database, login and file storage),
          Vercel (hosting), Resend (email), and our payment partner. Some may store data outside India.
        </li>
        <li>Government authorities, when the law requires it.</li>
      </ul>

      <h2>How long we keep it</h2>
      <p>
        We keep booking records for as long as tax and accounting laws require (usually 8 years). Medical notes and
        emergency contacts are only needed for the trek, and we delete them on request once it has ended. You can ask
        us to delete your account at any time.
      </p>

      <h2>Your rights</h2>
      <p>
        You can ask to see, correct or delete your personal data, withdraw consent, or name someone to act for you.
        Email <a href={`mailto:${email}`}>{email}</a>. If you book on behalf of others, make sure they agree to share
        their details with us and the organizer.
      </p>

      <h2>Security</h2>
      <p>
        Data is encrypted in transit and stored with access controls, so organizers see only bookings on their own
        treks. No system is perfectly secure; if a breach affects you, we&apos;ll tell you and the authorities as the
        law requires.
      </p>

      <h2>Contact and grievances</h2>
      <p>
        Questions or complaints about your data? Email <a href={`mailto:${email}`}>{email}</a> with the subject
        &quot;Privacy&quot;, or see our <Link href="/contact">contact page</Link>. We aim to resolve complaints within 15
        days. You can also complain to the Data Protection Board of India.
      </p>
    </LegalPage>
  );
}
