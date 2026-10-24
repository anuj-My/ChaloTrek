import { BellIcon } from "lucide-react";
import Link from "next/link";

import { ActionButton } from "@/components/shared/ActionButton";
import { buttonVariants } from "@/components/ui/button";
import { getUser } from "@/features/auth/queries";

import { followForBatches, stopAlert } from "../actions";
import { getMyAlertId } from "../queries";
import type { AlertTarget } from "../schema";

type Props = {
  target: AlertTarget;
  // What they'd follow, e.g. "Kedarkantha" or "Himalayan Hikers' Kedarkantha".
  name: string;
  // This page, to come back to after logging in.
  path: string;
};

// "Notify me about new batches" for a trek or destination. Used on trek
// pages and destination pages; reads the visitor's login, so render it at
// request time.
export async function NotifyMe({ target, name, path }: Props) {
  const user = await getUser();
  const alertId = user ? await getMyAlertId(target) : null;

  if (alertId) {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <BellIcon className="size-4" aria-hidden />
          We&apos;ll email you when {name} gets new batches.
        </span>
        <ActionButton action={stopAlert} fields={{ alert_id: alertId }} variant="ghost">
          Turn off
        </ActionButton>
      </div>
    );
  }

  if (!user) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(path)}`}
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        <BellIcon aria-hidden />
        Notify me about new batches
      </Link>
    );
  }

  return (
    <ActionButton action={followForBatches} fields={{ kind: target.kind, target_id: target.target_id }}>
      <BellIcon aria-hidden />
      Notify me about new batches
    </ActionButton>
  );
}
