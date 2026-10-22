"use client";

import { useState } from "react";

import { FormAlert } from "@/components/shared/FormAlert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRupees } from "@/lib/format";
import { useFormAction } from "@/lib/use-form-action";

import { recordOfflinePayment } from "../actions";

type Props = {
  bookingId: string;
  totalPaise: number;
  // Pre-filled amount: what's been received so far, or what's due to confirm.
  suggestedPaise: number;
  confirmed: boolean;
};

// "Mark as paid" for money received on UPI or cash. Collapsed to one button
// until the organizer opens it; closes again once saved.
export function OfflinePaymentForm({ bookingId, totalPaise, suggestedPaise, confirmed }: Props) {
  const [state, onSubmit, pending] = useFormAction(recordOfflinePayment);
  const [open, setOpen] = useState(false);
  const [handled, setHandled] = useState(state);
  if (state !== handled) {
    setHandled(state);
    if (state.ok) setOpen(false);
  }
  const inputId = `paid-${bookingId}`;

  if (!open) {
    return (
      <div className="space-y-1">
        <Button type="button" size="sm" variant={confirmed ? "ghost" : "default"} onClick={() => setOpen(true)}>
          {confirmed ? "Update payment" : "Mark as paid"}
        </Button>
        <FormAlert state={state} success="Payment saved." />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2 rounded-lg border p-3 text-left">
      <input type="hidden" name="booking_id" value={bookingId} />
      <label htmlFor={inputId} className="block text-sm font-medium text-foreground">
        Total received so far (₹)
      </label>
      <Input
        id={inputId}
        name="amount"
        type="number"
        inputMode="numeric"
        min={1}
        max={totalPaise / 100}
        defaultValue={suggestedPaise / 100}
        required
        autoFocus
        className="w-40"
        aria-invalid={!!state.fieldErrors?.amount}
      />
      <p className="text-xs text-muted-foreground">
        Booking total {formatRupees(totalPaise)}.{!confirmed && " Saving confirms the booking and keeps the seats."}
      </p>
      {state.fieldErrors?.amount && <p className="text-sm text-destructive">{state.fieldErrors.amount}</p>}
      <FormAlert state={state.fieldErrors ? {} : state} />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
