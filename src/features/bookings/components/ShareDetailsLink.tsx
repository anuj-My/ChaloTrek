"use client";

import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";

type Props = { token: string; firstName: string; trekName: string };

// Copy or WhatsApp a co-traveller their personal details link. Built in the
// browser, so it points at whichever site this is (localhost in dev).
export function ShareDetailsLink({ token, firstName, trekName }: Props) {
  const [copied, setCopied] = useState(false);
  const link = () => `${window.location.origin}/details/${token}`;
  const message = () =>
    `Hi ${firstName}, I've booked us on ${trekName}! Please fill in your details for the organizer (age, emergency contact, medical info): ${link()}`;

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={async () => {
          await navigator.clipboard.writeText(link());
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? "Copied" : "Copy link"}
      </Button>
      <a
        href="#"
        onClick={(e) => {
          // The link needs the browser's origin, so it's set on click.
          e.currentTarget.href = `https://wa.me/?text=${encodeURIComponent(message())}`;
        }}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonVariants({ size: "sm", variant: "outline" })}
      >
        Send on WhatsApp
      </a>
    </div>
  );
}
