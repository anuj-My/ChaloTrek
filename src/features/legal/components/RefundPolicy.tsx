import Link from "next/link";

import { siteConfig } from "@/lib/site-config";

import { LegalPage } from "./LegalPage";

// The three templates organizers pick from. Keep in step with the
// cancellation_policies rows seeded in supabase/migrations/20261019000000_init.sql.
const POLICIES = [
  {
    name: "Flexible",
    rules: ["15 or more days before departure: 100% refund", "7 to 14 days before: 50% refund", "Less than 7 days: no refund"],
  },
  {
    name: "Moderate",
    rules: ["30 or more days before departure: 75% refund", "15 to 29 days before: 50% refund", "Less than 15 days: no refund"],
  },
  {
    name: "Strict",
    rules: ["30 or more days before departure: 50% refund", "Less than 30 days: no refund"],
  },
];

export function RefundPolicy() {
  const { name } = siteConfig;
  const { email } = siteConfig.business;

  return (
    <LegalPage title="Cancellation and refund policy" updated="23 Oct 2026">
      <p>
        Each trek on {name} follows one of three cancellation policies, chosen by its organizer. The trek&apos;s policy
        is shown on the trek page and the booking form, before you pay.
      </p>

      <h2>If you cancel</h2>
      <p>
        Your refund depends on how many days before the departure date you cancel, and is a share of the amount you
        paid:
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        {POLICIES.map((policy) => (
          <div key={policy.name} className="rounded-lg border p-4">
            <p className="font-medium">{policy.name}</p>
            <ul className="mt-2 text-sm text-muted-foreground">
              {policy.rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p>
        To cancel a booking you haven&apos;t paid for yet, open it under <Link href="/my-bookings">My bookings</Link>{" "}
        and cancel it; the seats are released straight away. To cancel a paid booking, contact the organizer or email us
        with your booking ID.
      </p>

      <h2>If the organizer cancels</h2>
      <p>
        If the organizer cancels a batch for any reason, including weather, road closures or too few bookings, you get
        a full refund of what you paid. The organizer may also offer to move you to another batch instead; you can
        choose either.
      </p>

      <h2>Once the trek has started</h2>
      <p>
        There are no refunds for leaving a trek partway, or for not showing up. If the organizer cuts a trek short for
        safety, any partial refund is at their discretion.
      </p>

      <h2>How refunds are paid</h2>
      <p>
        Refunds for online payments go back to the original payment method, usually within 5 to 7 working days after
        they&apos;re approved, depending on your bank. Convenience fees, where charged, are not refundable unless the
        organizer cancels. For amounts you paid the organizer directly, the organizer refunds you.
      </p>

      <h2>Disputes</h2>
      <p>
        If you and the organizer can&apos;t agree on a refund, email <a href={`mailto:${email}`}>{email}</a> with your
        booking ID. We&apos;ll look at the booking and the trek&apos;s policy, and reply within 3 working days.
      </p>
    </LegalPage>
  );
}
