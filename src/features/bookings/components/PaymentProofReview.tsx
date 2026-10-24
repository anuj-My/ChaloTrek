"use client";

import { useState } from "react";

import { ActionButton } from "@/components/shared/ActionButton";
import { FormAlert } from "@/components/shared/FormAlert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime, formatRupees } from "@/lib/format";
import { useFormAction } from "@/lib/use-form-action";

import { reviewPaymentProof } from "../actions";

type Props = {
  proof: { id: string; amount_paise: number; utr: string; created_at: string; screenshotUrl: string | null };
  reference: string;
};

// A UPI payment the trekker says they made: the organizer finds it in their
// bank, then accepts it (confirming the booking) or rejects it with a reason.
export function PaymentProofReview({ proof, reference }: Props) {
  const [rejecting, setRejecting] = useState(false);
  const [state, onSubmit, pending] = useFormAction(reviewPaymentProof);
  const reasonId = `reject-${proof.id}`;

  return (
    <div className="space-y-3 rounded-lg border border-primary/40 bg-primary/5 p-3 text-left text-sm text-foreground">
      <div className="space-y-1">
        <p className="font-medium">Payment to check: {formatRupees(proof.amount_paise)} by UPI</p>
        <p className="text-muted-foreground">
          Transaction ID <span className="font-mono text-foreground select-all">{proof.utr}</span> · sent{" "}
          {formatDateTime(proof.created_at)}
        </p>
        {proof.screenshotUrl && (
          <a
            href={proof.screenshotUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-4"
          >
            View screenshot
          </a>
        )}
      </div>

      {rejecting ? (
        <form onSubmit={onSubmit} className="space-y-2">
          <input type="hidden" name="proof_id" value={proof.id} />
          <input type="hidden" name="decision" value="reject" />
          <label htmlFor={reasonId} className="block font-medium">
            Why can&apos;t you accept it?
          </label>
          <Textarea
            id={reasonId}
            name="reason"
            rows={2}
            required
            autoFocus
            placeholder="No payment with this transaction ID reached my account."
            aria-invalid={!!state.fieldErrors?.reason}
          />
          <p className="text-xs text-muted-foreground">
            The trekker is emailed this note and gets an hour to send the correct details.
          </p>
          {state.fieldErrors?.reason && <p className="text-destructive">{state.fieldErrors.reason}</p>}
          <FormAlert state={state.fieldErrors ? {} : state} />
          <div className="flex gap-2">
            <Button type="submit" size="sm" variant="destructive" disabled={pending}>
              {pending ? "Saving…" : "Reject payment"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setRejecting(false)}>
              Back
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-start gap-2">
          <ActionButton
            action={reviewPaymentProof}
            fields={{ proof_id: proof.id, decision: "accept" }}
            variant="default"
            confirm={`Accept ${formatRupees(proof.amount_paise)} for ${reference}? Only do this once it's in your account.`}
          >
            Accept payment
          </ActionButton>
          <Button type="button" size="sm" variant="ghost" onClick={() => setRejecting(true)}>
            Reject
          </Button>
        </div>
      )}
    </div>
  );
}
