"use client";

import { useState } from "react";

import { FormAlert } from "@/components/shared/FormAlert";
import { FormField } from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addDays } from "@/lib/format";
import { useFormAction } from "@/lib/use-form-action";

import { createBatch, updateBatch } from "../actions";

type Batch = {
  id: string;
  start_date: string;
  end_date: string;
  price_paise: number;
  deposit_paise: number | null;
  total_seats: number;
};

type Props = { trekId: string; durationDays: number; batch?: Batch };

// Adds a batch when `batch` is missing, otherwise edits it. Picking a start
// date fills in the end date from the trek's length until it's set by hand.
export function BatchForm({ trekId, durationDays, batch }: Props) {
  const [state, onSubmit, pending] = useFormAction(batch ? updateBatch : createBatch);
  const [start, setStart] = useState(batch?.start_date ?? "");
  const [end, setEnd] = useState(batch?.end_date ?? "");
  const [endEdited, setEndEdited] = useState(!!batch);
  const errors = state.fieldErrors ?? {};
  const shownEnd = endEdited || !start ? end : addDays(start, durationDays - 1);
  const idPrefix = batch ? `batch-${batch.id}` : "new-batch";

  // After adding a batch, clear the form for the next one. Remounting the
  // fields (via `fieldsKey`) also clears the uncontrolled price/seat inputs.
  const [handled, setHandled] = useState(state);
  const [fieldsKey, setFieldsKey] = useState(0);
  if (state !== handled) {
    setHandled(state);
    if (state.ok && !batch) {
      setStart("");
      setEnd("");
      setEndEdited(false);
      setFieldsKey((k) => k + 1);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="trek_id" value={trekId} />
      {batch && <input type="hidden" name="batch_id" value={batch.id} />}

      <div key={fieldsKey} className="grid gap-4 sm:grid-cols-2">
        <FormField label="Start date" htmlFor={`${idPrefix}-start`} error={errors.start_date}>
          <Input id={`${idPrefix}-start`} name="start_date" type="date" value={start} onChange={(e) => setStart(e.target.value)} required aria-invalid={!!errors.start_date} />
        </FormField>
        <FormField label="End date" htmlFor={`${idPrefix}-end`} error={errors.end_date}>
          <Input
            id={`${idPrefix}-end`}
            name="end_date"
            type="date"
            value={shownEnd}
            min={start || undefined}
            onChange={(e) => {
              setEndEdited(true);
              setEnd(e.target.value);
            }}
            required
            aria-invalid={!!errors.end_date}
          />
        </FormField>
        <FormField label="Price per person (₹)" htmlFor={`${idPrefix}-price`} error={errors.price}>
          <Input id={`${idPrefix}-price`} name="price" type="number" inputMode="numeric" min={100} defaultValue={batch ? batch.price_paise / 100 : ""} placeholder="8000" required aria-invalid={!!errors.price} />
        </FormField>
        <FormField label="Deposit per person (₹)" htmlFor={`${idPrefix}-deposit`} error={errors.deposit} hint="Optional. Leave empty to take full payment upfront.">
          <Input id={`${idPrefix}-deposit`} name="deposit" type="number" inputMode="numeric" min={100} defaultValue={batch?.deposit_paise ? batch.deposit_paise / 100 : ""} aria-invalid={!!errors.deposit} />
        </FormField>
        <FormField label="Total seats" htmlFor={`${idPrefix}-seats`} error={errors.total_seats}>
          <Input id={`${idPrefix}-seats`} name="total_seats" type="number" inputMode="numeric" min={1} max={200} defaultValue={batch?.total_seats ?? ""} placeholder="20" required aria-invalid={!!errors.total_seats} />
        </FormField>
      </div>

      <FormAlert state={state} success={batch ? "Saved." : "Batch added."} />
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : batch ? "Save batch" : "Add batch"}
      </Button>
    </form>
  );
}
