import { BadgeCheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export const VERIFIED_MEANING =
  "Chalo Trek has checked this organizer's KYC and state adventure-tourism registration.";

// Shown next to an organizer's name once an admin has verified their tourism
// registration. `label` adds the word for places with room for it.
export function VerifiedBadge({ label = false, className }: { label?: boolean; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 align-middle text-success", className)}
      title={VERIFIED_MEANING}
    >
      <BadgeCheckIcon aria-hidden className="size-4 shrink-0" />
      {label ? <span className="text-sm font-medium">Verified organizer</span> : <span className="sr-only">Verified organizer</span>}
    </span>
  );
}
