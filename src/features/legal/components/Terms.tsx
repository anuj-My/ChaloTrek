import Link from "next/link";

import { siteConfig } from "@/lib/site-config";

import { LegalPage } from "./LegalPage";

// A plain-language starting point. Have a lawyer review it before launch
// (docs/plan.md, section 7).
export function Terms() {
  const { name } = siteConfig;
  const { legalName, email } = siteConfig.business;
  const operator = legalName || name;

  return (
    <LegalPage title="Terms of service" updated="23 Oct 2026">
      <p>
        These terms apply when you use {name} ({siteConfig.url.replace("https://", "")}), run by {operator}. By
        creating an account or booking a trek, you agree to them.
      </p>

      <h2>What {name} is</h2>
      <p>
        {name} is a booking platform. Independent trek organizers list their treks and batches here, and trekkers book
        and pay for them. <strong>{name} does not run treks.</strong> The organizer named on each trek page runs that
        trek and is responsible for it, including the itinerary, guides, safety, permits, transport, stay and food.
      </p>

      <h2>For trekkers</h2>
      <ul>
        <li>You must be 18 or older to make a booking. You can book for others, including minors you are responsible for.</li>
        <li>
          Give accurate details for everyone in your booking, including any medical conditions. The organizer relies on
          them to keep the group safe.
        </li>
        <li>
          Trekking at altitude carries real risks. Check that you are fit for the trek you book, follow the
          organizer&apos;s and guides&apos; instructions, and consider travel insurance.
        </li>
        <li>
          When you start a booking, your seats are held for 10 minutes while you pay. If payment isn&apos;t completed
          in that time, the seats are released.
        </li>
        <li>Your booking is confirmed only once payment is received. You&apos;ll get a confirmation email.</li>
        <li>
          Cancellations and refunds follow the organizer&apos;s cancellation policy, shown on the trek page before you
          pay. See our <Link href="/refund-policy">cancellation and refund policy</Link>.
        </li>
      </ul>

      <h2>For organizers</h2>
      <ul>
        <li>
          You confirm that your business details, PAN, bank account and any tourism registration you provide are
          accurate and current. We verify them before your treks go live.
        </li>
        <li>
          You hold the registrations, permits and insurance the law requires for the treks you run, and use trained
          leaders with first-aid kits.
        </li>
        <li>Trek details, prices, dates and seats you list must be accurate. You honour bookings made through {name}.</li>
        <li>
          You follow the cancellation policy you chose for each trek, and refund trekkers in full if you cancel a
          batch.
        </li>
        <li>
          You use trekkers&apos; personal details only to run their trek, and keep them secure.
        </li>
        <li>We may remove listings or suspend accounts that break these terms or draw repeated complaints.</li>
      </ul>

      <h2>Prices, payments and fees</h2>
      <p>
        Prices are set by the organizer and shown in Indian rupees. Where a batch takes a deposit, you pay the deposit
        to book and the balance to the organizer as they direct. Online payments are processed by our payment partner;
        we never see or store your card or bank details. {name} may charge organizers a fee per booking, and may show a
        convenience fee to trekkers before payment.
      </p>

      <h2>Service delivery</h2>
      <p>
        {name} sells no physical goods and ships nothing. After a confirmed booking, you receive a confirmation email,
        and your booking appears under My bookings. The trek itself is delivered by the organizer on the booked dates.
      </p>

      <h2>Liability</h2>
      <p>
        Because organizers run the treks, {name} is not liable for injury, loss, delay or damage that happens on or
        around a trek, or for an organizer&apos;s acts or omissions. To the extent the law allows, our total liability
        to you for any booking is limited to the fee we earned on it. Nothing here limits rights you have under Indian
        consumer law.
      </p>

      <h2>Accounts</h2>
      <p>
        Keep access to your email and Google account secure, since they are how you log in. You are responsible for
        bookings made from your account. Don&apos;t misuse the platform, for example by making fake bookings or
        scraping it.
      </p>

      <h2>Changes and law</h2>
      <p>
        We may update these terms. The date at the top shows the latest version, and continuing to use {name} after a
        change means you accept it. These terms are governed by the laws of India.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms? Email <a href={`mailto:${email}`}>{email}</a> or see our{" "}
        <Link href="/contact">contact page</Link>.
      </p>
    </LegalPage>
  );
}
